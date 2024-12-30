import antfu from '@antfu/eslint-config'

export default antfu(
  // add console rule
  {
    rules: {
      'no-console': 'off',
    },
  },
)
