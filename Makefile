.PHONY: infra

infra:
	@echo "==> Checking PostgreSQL database..."
	@cd packages/api && pnpm db:ensure
	@echo "==> Running migrations..."
	@cd packages/api && pnpm db:push
	@echo "==> Seeding users..."
	@cd packages/api && pnpm db:seed
	@echo "==> Seeding built-in tools..."
	@cd packages/api && pnpm db:seed-tools
	@echo "==> Done."
