module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  extends: [
    "react-app",
    "react-app/jest"
  ],

  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },

  rules: {
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],

    "react/prop-types": "off",

    "no-console": ["warn", { allow: ["warn", "error"] }],

    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],

    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",

    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },

  settings: {
    react: {
      version: "detect",
    },
  },
};