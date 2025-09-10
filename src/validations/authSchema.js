const yup = require("yup");

const registerSchema = yup.object().shape({
  body: yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .required("Password is required"),
  }),
});

const loginSchema = yup.object().shape({
  body: yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    password: yup.string().required("Password is required"),
  }),
});

const refreshTokenSchema = yup.object().shape({
  body: yup.object().shape({
    refreshToken: yup.string().required("Refresh token is required"),
  }),
});

const sendOtpSchema = yup.object().shape({
  body: yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
  }),
});

const verifyOtpSchema = yup.object().shape({
  body: yup.object().shape({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    otp: yup
      .string()
      .length(6, "OTP must be 6 digits")
      .required("OTP is required"),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
};
