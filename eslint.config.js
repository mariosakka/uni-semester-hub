import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {ignores: ["dist/", "node_modules/", "public/"]},
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    languageOptions: {ecmaVersion: 2022, sourceType: "module", globals: {...globals.browser, __APP_VERSION__: "readonly", __REPO_URL__: "readonly"}},
    rules: {
      "vue/multi-word-component-names": "error",
      "vue/block-order": ["error", {order: ["script", "template", "style"]}],
      "vue/define-macros-order": "error",
      "vue/component-api-style": ["error", ["script-setup"]], // Composition API with <script setup> only
      "vue/prefer-define-options": "error",
      "vue/require-explicit-emits": "error",
      "vue/require-prop-types": "error",
      "vue/no-v-html": "error", // trusted data HTML goes through <RichText> only
      "vue/max-attributes-per-line": "off", "vue/singleline-html-element-content-newline": "off", "vue/html-self-closing": "off",
      "vue/html-indent": "off", "vue/html-closing-bracket-newline": "off", "vue/multiline-html-element-content-newline": "off",
      "no-unused-vars": ["error", {argsIgnorePattern: "^_"}]
    }
  },
  {files: ["src/components/RichText.vue"], rules: {"vue/no-v-html": "off"}},
  {files: ["scripts/**", "*.config.js"], languageOptions: {globals: globals.node}},
  {files: ["**/*.test.js"], languageOptions: {globals: globals.node}}
];
