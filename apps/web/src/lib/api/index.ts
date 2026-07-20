export {
  publicApi,
  publicRequest,
  publicGet,
  publicPost,
  publicPut,
  publicPatch,
  publicDelete,
} from './public-api';

export {
  authApi,
  authRequest,
  authGet,
  authPost,
  authPut,
  authPatch,
  authDelete,
  authUpload,
  setAccessTokenResolver,
  ensureFreshAccessToken,
  type AccessTokenResolver,
} from './auth-api';

export { authApi as api } from './auth-api';
export { authRequest as apiRequest } from './auth-api';
export { authGet as apiGet } from './auth-api';
export { authPost as apiPost } from './auth-api';
export { authPut as apiPut } from './auth-api';
export { authPatch as apiPatch } from './auth-api';
export { authDelete as apiDelete } from './auth-api';
export { authUpload as apiUpload } from './auth-api';
export { authApi as default } from './auth-api';
