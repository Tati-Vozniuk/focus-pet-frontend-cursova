import posthog from 'posthog-js';

const initPostHog = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY;
    const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST;

    if (!POSTHOG_KEY) {
      console.warn('PostHog key is missing');
      return posthog;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      ui_host: 'https://eu.posthog.com',

      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
    });
    // eslint-disable-next-line no-console
    console.log('PostHog initialized');
  }

  return posthog;
};

export const analytics = {
  init: initPostHog,

  capture: (eventName, properties = {}) => {
    if (posthog.__loaded) {
      posthog.capture(eventName, properties);
    }
  },

  identify: (userId, traits = {}) => {
    if (posthog.__loaded) {
      posthog.identify(userId, traits);
    }
  },

  reset: () => {
    if (posthog.__loaded) {
      posthog.reset();
    }
  },

  isFeatureEnabled: (flagKey) => {
    if (posthog.__loaded) {
      return posthog.isFeatureEnabled(flagKey);
    }
    return false;
  },

  onFeatureFlags: (callback) => {
    if (posthog.__loaded) {
      posthog.onFeatureFlags(callback);
    }
  },
};

export default analytics;
