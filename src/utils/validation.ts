export const validateEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password: string) => {
  // 최소 8자, 영문, 숫자, 특수문자 포함
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return regex.test(password);
};

export const validatePasswordMatch = (pw: string, confirm: string) => {
  return pw === confirm;
};

export const validatePhone = (phone: string) => {
  // 010으로 시작하는 11자리 숫자
  const regex = /^010\d{8}$/;
  return regex.test(phone.replace(/-/g, '')); // 하이픈 제거 후 검사
};