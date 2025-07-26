# Specialized Agents for Flexible Business Website

This directory contains configuration files for specialized agents that handle different aspects of the website project. Each agent has specific responsibilities, tools, and triggers for automated execution.

## Available Agents

### 1. **security-auditor**
- **Focus**: Web application security and vulnerability prevention
- **Key Tasks**: Security scanning, header implementation, input validation, SSL configuration
- **Compliance**: OWASP Top 10, security best practices

### 2. **performance-optimizer**
- **Focus**: Website performance and Core Web Vitals
- **Key Tasks**: Bundle optimization, lazy loading, CDN setup, image optimization
- **Target**: Sub-3-second load times, excellent Core Web Vitals scores

### 3. **accessibility-compliance**
- **Focus**: WCAG 2.1 AA compliance and inclusive design
- **Key Tasks**: ARIA implementation, keyboard navigation, screen reader compatibility
- **Standards**: WCAG 2.1 Level AA, Section 508, ADA compliance

### 4. **deployment-orchestrator**
- **Focus**: CI/CD pipelines and deployment automation
- **Key Tasks**: Pipeline setup, blue-green deployments, health monitoring, automatic rollbacks
- **Strategies**: Zero-downtime deployments, containerization

### 5. **analytics-integrator**
- **Focus**: User behavior tracking and business intelligence
- **Key Tasks**: Google Analytics setup, conversion tracking, heatmaps, custom events
- **Deliverables**: Weekly performance reports, user insights, ROI analysis

## Agent Activation

Each agent can be activated based on:
- **Event Triggers**: Code commits, deployments, configuration changes
- **Scheduled Tasks**: Daily scans, weekly audits, monthly reports
- **Manual Invocation**: On-demand execution for specific tasks
- **Threshold Alerts**: Performance degradation, security issues, accessibility violations

## Integration Points

Agents work together through:
- Shared configuration files
- Event bus for inter-agent communication
- Centralized logging and monitoring
- Unified dashboard for status overview

## Usage

To activate an agent or modify its configuration, edit the corresponding YAML file in this directory. Each agent file contains:
- Description and capabilities
- Specific responsibilities
- Tools and integrations
- Trigger conditions
- Metrics and standards

Last updated: 2025-07-25