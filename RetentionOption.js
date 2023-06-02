// RetentionOption.js

module.exports.logRetentionInDays = () => {
  return {
    ci: 7,
    qa: 7,
    uat: 7,
    stg: 7,
    primary: 3653,
  };
};
