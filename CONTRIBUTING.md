# Contributing to ShadowPay SDK

Thank you for your interest in contributing to ShadowPay! We welcome contributions from the community.

## Development Setup

1. **Fork and clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/shadowpay-sdk.git
cd shadowpay-sdk
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Build packages:**

```bash
pnpm build
```

4. **Run tests:**

```bash
pnpm test
```

## Project Structure

```
shadowpay-sdk/
├── packages/
│   ├── client/         # Browser SDK
│   ├── server/         # Node.js SDK
│   └── core/           # Core utilities
├── examples/
│   ├── nextjs-paywall/ # Next.js example
│   └── express-api/    # Express example
└── docs/               # Documentation
```

## Making Changes

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and add tests

3. Run tests:

```bash
pnpm test
```

4. Build and verify:

```bash
pnpm build
```

5. Commit your changes:

```bash
git commit -m "feat: add your feature"
```

6. Push and create a pull request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test updates
- `chore:` Maintenance tasks

## Testing

- Write tests for all new features
- Ensure existing tests pass
- Add integration tests when applicable

## Code Style

- Use TypeScript
- Follow existing code style
- Run `pnpm lint` before committing

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers

## Questions?

- Open an issue on GitHub
- Join our Discord
- Email: support@shadow.radr.fun

Thank you for contributing! 🎉

