.PHONY: infra

infra:
	@echo "==> Checking PostgreSQL database..."
	@cd packages/api && pnpm db:ensure
	@echo "==> Running migrations..."
	@cd packages/api && pnpm db:push
	@echo "==> Done."
