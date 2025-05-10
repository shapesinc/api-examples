# Contributing to Shape Mail Service

Thank you for your interest in contributing to the Shape Mail Service! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Submitting Changes](#submitting-changes)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be considerate in your interactions with others and focus on technical merits in discussions.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
   ```bash
   git clone https://github.com/yourusername/shape-mail.git
   cd shape-mail
   ```
3. Set up the upstream remote
   ```bash
   git remote add upstream https://github.com/shapesinc/shape-mail.git
   ```
4. Create a new branch for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Environment

1. Create and activate a virtual environment
   ```bash
   python -m venv nenv
   source nenv/bin/activate  # On Windows: nenv\Scripts\activate
   ```
2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
3. Install development dependencies
   ```bash
   pip install black ruff pytest
   ```
4. Set up environment variables by copying `.env.example` to `.env` and filling in the values
   ```bash
   cp .env.example .env
   ```

## Submitting Changes

1. Make your changes in your feature branch
2. Add and commit your changes with a clear commit message
   ```bash
   git add .
   git commit -m "Add feature: your clear description of the feature"
   ```
3. Push your changes to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
4. Submit a pull request to the main repository

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Update documentation as needed
3. Include tests for new functionality
4. Ensure your code passes all tests
5. Link any relevant issues in your pull request description
6. Request a review from one of the maintainers
7. Address any feedback from reviewers

## Style Guidelines

- Follow PEP 8 style guide for Python code
- Use meaningful variable and function names
- Include docstrings for all functions, classes, and modules
- Keep functions small and focused on a single task
- Format your code using Black
- Use type hints where appropriate

## Testing

- Add tests for all new functionality
- Ensure all tests pass before submitting a pull request
- Run tests using pytest
  ```bash
  pytest
  ```

## Issue Reporting

When reporting issues, please include:

1. A clear and descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots or logs if applicable
6. Environment information (OS, Python version, etc.)

Use the provided issue templates when submitting a new issue.

## Feature Requests

Feature requests are welcome! Please use the feature request template and include:

1. A clear description of the feature
2. The problem it solves
3. Any alternative solutions you've considered
4. Any additional context or screenshots

Thank you for contributing to the Shape Mail Service! Your efforts help make this project better for everyone. 