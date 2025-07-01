# Version Control & Release Management

This document outlines the version control strategy and release management process for TempEmailPro.

## Versioning Strategy

We follow [Semantic Versioning (SemVer)](https://semver.org/) with the format `MAJOR.MINOR.PATCH`:

### Version Format: `X.Y.Z`

- **MAJOR (X)**: Breaking changes that require user intervention
- **MINOR (Y)**: New features that are backward compatible
- **PATCH (Z)**: Bug fixes and small improvements

### Examples
- `1.0.0` → `1.1.0`: New feature (Stripe integration)
- `1.1.0` → `1.1.1`: Bug fix (email generation error)
- `1.1.1` → `2.0.0`: Breaking change (API restructure)

## Branch Strategy

### Main Branches

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`staging`** - Pre-production testing

### Feature Branches

- **Format**: `feature/description-of-feature`
- **Examples**: 
  - `feature/stripe-integration`
  - `feature/email-forwarding`
  - `feature/bulk-email-creation`

### Release Branches

- **Format**: `release/vX.Y.Z`
- **Purpose**: Prepare and stabilize releases
- **Example**: `release/v1.1.0`

### Hotfix Branches

- **Format**: `hotfix/description`
- **Purpose**: Critical production fixes
- **Example**: `hotfix/email-generation-error`

## Git Workflow

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Development work
git add .
git commit -m "feat: implement new feature"

# Push and create PR
git push origin feature/new-feature
```

### 2. Release Process

```bash
# Create release branch
git checkout develop
git checkout -b release/v1.1.0

# Update version numbers
# Update CHANGELOG.md
# Run tests and fix issues

# Merge to main and tag
git checkout main
git merge --no-ff release/v1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.1.0

# Push everything
git push origin main develop --tags
```

### 3. Hotfix Process

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-bug

# Fix the issue
git add .
git commit -m "fix: resolve critical email generation bug"

# Merge to main and develop
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.0.1 -m "Hotfix version 1.0.1"

git checkout develop
git merge --no-ff hotfix/critical-bug

git push origin main develop --tags
```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
feat(auth): implement Google OAuth integration
fix(email): resolve domain validation error
docs(api): update email generation endpoint documentation
refactor(database): optimize user query performance
```

## Release Checklist

### Pre-Release

- [ ] All features tested and reviewed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version numbers updated in package.json
- [ ] Environment variables documented
- [ ] Database migrations reviewed

### Release

- [ ] Create release branch
- [ ] Run full test suite
- [ ] Security audit completed
- [ ] Performance benchmarks verified
- [ ] Staging deployment successful
- [ ] Create GitHub release with release notes

### Post-Release

- [ ] Production deployment verified
- [ ] Monitoring alerts configured
- [ ] Team notified of release
- [ ] Customer communication (if needed)
- [ ] Hotfix branch ready (if needed)

## Tools and Automation

### GitHub Actions

- **CI/CD Pipeline**: Automated testing and deployment
- **Release Automation**: Automatic tagging and release notes
- **Dependency Updates**: Automated security updates

### Version Management

```bash
# Install standard-version for automated versioning
npm install -g standard-version

# Bump version and generate changelog
standard-version

# Push with tags
git push --follow-tags origin main
```

## Security Considerations

### Branch Protection

- **main**: Require PR reviews, status checks
- **develop**: Require PR reviews
- **release/***: Require PR reviews, admin approval

### Secret Management

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Rotate secrets regularly
- Use GitHub Secrets for CI/CD

## Deployment Strategy

### Environments

1. **Development**: Feature branches auto-deploy to dev environment
2. **Staging**: Release branches deploy to staging for testing
3. **Production**: Only main branch deploys to production

### Database Migrations

- Version controlled in `lib/database-migrations/`
- Tested in staging before production
- Rollback procedures documented

## Emergency Procedures

### Critical Bug Process

1. **Immediate**: Create hotfix branch from main
2. **Fix**: Implement minimal fix with tests
3. **Review**: Fast-track review process
4. **Deploy**: Emergency deployment to production
5. **Communicate**: Notify team and users
6. **Follow-up**: Post-mortem and prevention measures

---

**Maintained by**: Sayem Abdullah Rihan (Code-Craka)  
**Last Updated**: 2025-01-01  
**Version**: 1.0.0