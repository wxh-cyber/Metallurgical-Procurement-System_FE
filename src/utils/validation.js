export const positiveNumber = (rule, value, callback) => {
  if (value === undefined || Number(value) <= 0)
    callback(new Error("请输入正数"));
  else callback();
};
