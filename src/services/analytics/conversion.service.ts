import { analytics, ConversionEvent } from "./analytics.service";

export interface ConversionGoal {
  id: string;
  name: string;
  type: "destination" | "duration" | "event" | "pages_per_session";
  value?: number;
  currency?: string;
  conditions?: ConversionCondition[];
}

export interface ConversionCondition {
  type: "url" | "event" | "duration" | "pages";
  operator:
    | "equals"
    | "contains"
    | "starts_with"
    | "regex"
    | "greater_than"
    | "less_than";
  value: string | number;
}

export interface FunnelStep {
  name: string;
  url?: string;
  event?: string;
  required?: boolean;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  goalValue?: number;
  currency?: string;
}

class ConversionTracking {
  private goals: Map<string, ConversionGoal> = new Map();
  private funnels: Map<string, ConversionFunnel> = new Map();
  private sessionData: {
    startTime: number;
    pageViews: number;
    events: string[];
    urls: string[];
  };

  constructor() {
    this.sessionData = {
      startTime: Date.now(),
      pageViews: 0,
      events: [],
      urls: [],
    };
    this.setupDefaultGoals();
  }

  private setupDefaultGoals() {
    // Common conversion goals
    this.addGoal({
      id: "signup",
      name: "User Sign Up",
      type: "event",
      value: 50,
      conditions: [{ type: "event", operator: "equals", value: "user_signup" }],
    });

    this.addGoal({
      id: "purchase",
      name: "Purchase Complete",
      type: "event",
      value: 0, // Dynamic value
      conditions: [{ type: "event", operator: "equals", value: "purchase" }],
    });

    this.addGoal({
      id: "newsletter",
      name: "Newsletter Subscription",
      type: "event",
      value: 10,
      conditions: [
        { type: "event", operator: "equals", value: "newsletter_subscribe" },
      ],
    });

    this.addGoal({
      id: "contact",
      name: "Contact Form Submission",
      type: "event",
      value: 25,
      conditions: [
        { type: "event", operator: "equals", value: "contact_form_submit" },
      ],
    });

    this.addGoal({
      id: "engagement",
      name: "High Engagement Session",
      type: "duration",
      value: 5,
      conditions: [
        { type: "duration", operator: "greater_than", value: 300000 }, // 5 minutes
      ],
    });
  }

  addGoal(goal: ConversionGoal) {
    this.goals.set(goal.id, goal);
  }

  removeGoal(goalId: string) {
    this.goals.delete(goalId);
  }

  addFunnel(funnel: ConversionFunnel) {
    this.funnels.set(funnel.id, funnel);
  }

  removeFunnel(funnelId: string) {
    this.funnels.delete(funnelId);
  }

  trackConversion(goalId: string, value?: number, transactionId?: string) {
    const goal = this.goals.get(goalId);
    if (!goal) {
      console.warn(`Conversion goal ${goalId} not found`);
      return;
    }

    const conversion: ConversionEvent = {
      conversionId: goalId,
      value: value || goal.value,
      currency: goal.currency,
      transactionId,
    };

    analytics.trackConversion(conversion);

    // Also track as custom event
    analytics.trackEvent({
      category: "conversion",
      action: "goal_completion",
      label: goal.name,
      value: conversion.value,
      properties: {
        goal_id: goalId,
        goal_name: goal.name,
        transaction_id: transactionId,
      },
    });
  }

  trackMicroConversion(action: string, value?: number) {
    analytics.trackEvent({
      category: "micro_conversion",
      action: action,
      value: value,
      properties: {
        session_duration: Date.now() - this.sessionData.startTime,
        page_views: this.sessionData.pageViews,
      },
    });
  }

  trackFunnelStep(
    funnelId: string,
    stepIndex: number,
    abandoned: boolean = false,
  ) {
    const funnel = this.funnels.get(funnelId);
    if (!funnel || !funnel.steps[stepIndex]) {
      console.warn(`Funnel ${funnelId} or step ${stepIndex} not found`);
      return;
    }

    const step = funnel.steps[stepIndex];
    const eventAction = abandoned ? "step_abandoned" : "step_completed";

    analytics.trackEvent({
      category: "funnel",
      action: eventAction,
      label: `${funnel.name} - ${step.name}`,
      value: stepIndex + 1,
      properties: {
        funnel_id: funnelId,
        funnel_name: funnel.name,
        step_index: stepIndex,
        step_name: step.name,
        total_steps: funnel.steps.length,
      },
    });

    // Track funnel completion
    if (!abandoned && stepIndex === funnel.steps.length - 1) {
      this.trackConversion(`funnel_${funnelId}`, funnel.goalValue);
    }
  }

  updateSessionData(event: { type: "pageview" | "event"; value: string }) {
    if (event.type === "pageview") {
      this.sessionData.pageViews++;
      this.sessionData.urls.push(event.value);
    } else {
      this.sessionData.events.push(event.value);
    }

    // Check if any goals are met
    this.checkGoalCompletion();
  }

  private checkGoalCompletion() {
    for (const [goalId, goal] of this.goals) {
      if (this.isGoalMet(goal)) {
        this.trackConversion(goalId);
      }
    }
  }

  private isGoalMet(goal: ConversionGoal): boolean {
    if (!goal.conditions || goal.conditions.length === 0) return false;

    return goal.conditions.every((condition) => {
      switch (condition.type) {
        case "event":
          return this.checkEventCondition(condition);
        case "duration":
          return this.checkDurationCondition(condition);
        case "pages":
          return this.checkPagesCondition(condition);
        case "url":
          return this.checkUrlCondition(condition);
        default:
          return false;
      }
    });
  }

  private checkEventCondition(condition: ConversionCondition): boolean {
    const eventValue = condition.value as string;
    return this.sessionData.events.some((event) => {
      switch (condition.operator) {
        case "equals":
          return event === eventValue;
        case "contains":
          return event.includes(eventValue);
        case "starts_with":
          return event.startsWith(eventValue);
        case "regex":
          return new RegExp(eventValue).test(event);
        default:
          return false;
      }
    });
  }

  private checkDurationCondition(condition: ConversionCondition): boolean {
    const duration = Date.now() - this.sessionData.startTime;
    const targetDuration = condition.value as number;

    switch (condition.operator) {
      case "greater_than":
        return duration > targetDuration;
      case "less_than":
        return duration < targetDuration;
      case "equals":
        return Math.abs(duration - targetDuration) < 1000; // 1 second tolerance
      default:
        return false;
    }
  }

  private checkPagesCondition(condition: ConversionCondition): boolean {
    const pageViews = this.sessionData.pageViews;
    const targetPages = condition.value as number;

    switch (condition.operator) {
      case "greater_than":
        return pageViews > targetPages;
      case "less_than":
        return pageViews < targetPages;
      case "equals":
        return pageViews === targetPages;
      default:
        return false;
    }
  }

  private checkUrlCondition(condition: ConversionCondition): boolean {
    const urlValue = condition.value as string;
    const currentUrl = window.location.href;

    switch (condition.operator) {
      case "equals":
        return currentUrl === urlValue;
      case "contains":
        return currentUrl.includes(urlValue);
      case "starts_with":
        return currentUrl.startsWith(urlValue);
      case "regex":
        return new RegExp(urlValue).test(currentUrl);
      default:
        return false;
    }
  }

  // A/B Testing conversions
  trackABTestConversion(
    testId: string,
    variant: string,
    goalId: string,
    value?: number,
  ) {
    analytics.trackEvent({
      category: "ab_test",
      action: "conversion",
      label: `${testId}_${variant}`,
      value: value,
      properties: {
        test_id: testId,
        variant: variant,
        goal_id: goalId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const conversionTracking = new ConversionTracking();
