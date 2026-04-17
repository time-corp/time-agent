import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { AppError, ErrorCode } from "../lib/errors";
import { getSkillByName, type SkillDefinition } from "./skill-registry-service";
import { executeShellInSandbox } from "./sandbox-exec-service";
import { copyArtifactFromSandbox } from "./sandbox-artifact-service";

export type SkillRunArtifact = {
  id: string;
  kind: "image" | "file";
  fileName: string;
  mimeType: string;
  sandboxPath: string;
  storagePath: string;
};

export type SkillRunResult = {
  runId: string;
  skill: SkillDefinition;
  summary: string;
  artifacts: SkillRunArtifact[];
  logs: string;
  steps: SkillRunStep[];
};

export type SkillRunStep = {
  at: string;
  step: string;
  status: "start" | "done" | "error" | "info";
  detail?: Record<string, unknown>;
};

export type ExecuteSkillInput = {
  skillName: string;
  input: {
    url?: string;
    fullPage?: boolean;
    outputName?: string;
  };
};

function buildSandboxArtifactPath(runId: string, outputName = "artifact.png") {
  const safeName = outputName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `/workspace/runs/${runId}/artifacts/${safeName}`;
}

function createStepLogger(runId: string, skillName: string) {
  const steps: SkillRunStep[] = [];

  const addStep = (
    step: string,
    status: SkillRunStep["status"],
    detail?: Record<string, unknown>,
  ) => {
    const entry: SkillRunStep = {
      at: new Date().toISOString(),
      step,
      status,
    };

    if (detail) {
      entry.detail = detail;
    }

    steps.push(entry);
    console.info(
      "[skill-trace]",
      JSON.stringify({
        runId,
        skillName,
        at: entry.at,
        step,
        status,
        detail,
      }),
    );
  };

  return { steps, addStep };
}

async function runBrowserScreenshotSkill(
  skill: SkillDefinition,
  runId: string,
  input: ExecuteSkillInput["input"],
  addStep: (
    step: string,
    status: SkillRunStep["status"],
    detail?: Record<string, unknown>,
  ) => void,
) {
  if (!input.url) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Skill input.url is required",
      400,
    );
  }

  const outputName =
    input.outputName && extname(input.outputName)
      ? input.outputName
      : `${input.outputName ?? "page"}.png`;
  const sandboxPath = buildSandboxArtifactPath(runId, outputName);
  const fullPageFlag = input.fullPage ? "--full" : "";
  addStep("skill.browser.prepare", "start", {
    url: input.url,
    outputName,
    sandboxPath,
    fullPage: input.fullPage ?? false,
  });
  // addStep("skill.browser.exec", "info", {
  //   skipped: true,
  //   reason: "Sandbox browser execution is temporarily disabled while validating skill folder access.",
  //   plannedCommand: [
  //     "mkdir -p /workspace/runs/" + runId + "/artifacts",
  //     "agent-browser skills get core --full",
  //     `agent-browser open ${JSON.stringify(input.url)}`,
  //     "agent-browser snapshot -i",
  //     `agent-browser screenshot ${fullPageFlag} ${JSON.stringify(sandboxPath)}`.trim(),
  //     "agent-browser close",
  //   ],
  // })

  // Temporary short-circuit:
  // keep skill discovery + trace logging active first, then re-enable sandbox execution.
  const command = [
    "mkdir -p /workspace/runs/" + runId + "/artifacts",
    `agent-browser open ${JSON.stringify(input.url)}`,
    "agent-browser snapshot -i",
    `agent-browser screenshot ${fullPageFlag} ${JSON.stringify(sandboxPath)}`.trim(),
    "agent-browser close",
  ].join(" && ");

  const execResult = await executeShellInSandbox(command, {
    onStep: (step, detail) => addStep(step, "info", detail),
  });
  addStep("skill.browser.exec", "done", {
    exitCode: execResult.exitCode,
    outputPreview: execResult.output.slice(0, 2000),
  });
  const stored = await copyArtifactFromSandbox(runId, sandboxPath);
  addStep("skill.browser.artifact", "done", {
    sandboxPath,
    storagePath: stored.storagePath,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
  });

  return {
    summary: `Captured screenshot of ${input.url} using skill "${skill.name}".`,
    artifacts: [
      {
        id: randomUUID(),
        kind: "image" as const,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        sandboxPath: stored.sandboxPath,
        storagePath: stored.storagePath,
      },
    ],
    logs: execResult.output,
  };
}

export async function executeSkill(
  input: ExecuteSkillInput,
): Promise<SkillRunResult> {
  const runId = randomUUID();
  const { steps, addStep } = createStepLogger(runId, input.skillName);
  addStep("skill.resolve", "start", { skillName: input.skillName });
  let skill: SkillDefinition;

  try {
    skill = await getSkillByName(input.skillName);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    addStep("skill.resolve", "error", {
      message: err.message,
      name: err.name,
    });
    throw error;
  }

  addStep("skill.resolve", "done", {
    skillName: skill.name,
    tags: skill.tags,
    filePath: skill.filePath,
  });
  const hasBrowserScreenshotTags =
    skill.tags.includes("browser") && skill.tags.includes("screenshot");

  try {
    if (hasBrowserScreenshotTags) {
      const result = await runBrowserScreenshotSkill(
        skill,
        runId,
        input.input,
        addStep,
      );
      addStep("skill.complete", "done", {
        artifactCount: result.artifacts.length,
      });
      return {
        runId,
        skill,
        summary: result.summary,
        artifacts: result.artifacts,
        logs: result.logs,
        steps,
      };
    }

    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Skill "${skill.name}" does not have a registered executor yet`,
      400,
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    addStep("skill.complete", "error", {
      message: err.message,
      name: err.name,
    });
    throw error;
  }
}
