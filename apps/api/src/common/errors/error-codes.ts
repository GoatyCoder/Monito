export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DB_ERROR: 'DB_ERROR',
  DB_UNIQUE_CONSTRAINT: 'DB_UNIQUE_CONSTRAINT',
  DB_FOREIGN_KEY_CONSTRAINT: 'DB_FOREIGN_KEY_CONSTRAINT',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_INVALID_PASSWORD: 'AUTH_INVALID_PASSWORD',
  AUTH_USER_DISABLED: 'AUTH_USER_DISABLED',
  AUTH_INVALID_REFRESH_TOKEN: 'AUTH_INVALID_REFRESH_TOKEN',
  AUTH_REFRESH_REVOKED: 'AUTH_REFRESH_REVOKED',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_SELF_ADMIN_DEACTIVATE: 'USER_SELF_ADMIN_DEACTIVATE',
  USER_LAST_ACTIVE_ADMIN_DEACTIVATE: 'USER_LAST_ACTIVE_ADMIN_DEACTIVATE',
  USER_SELF_ADMIN_ROLE_CHANGE: 'USER_SELF_ADMIN_ROLE_CHANGE',
  USER_LAST_ACTIVE_ADMIN_ROLE_CHANGE: 'USER_LAST_ACTIVE_ADMIN_ROLE_CHANGE',
  USER_SELF_DELETE: 'USER_SELF_DELETE',
  USER_LAST_ACTIVE_ADMIN_DELETE: 'USER_LAST_ACTIVE_ADMIN_DELETE',
  FIELD_LOT_DUPLICATE_CODE: 'FIELD_LOT_DUPLICATE_CODE',
  FIELD_LOT_NOT_FOUND: 'FIELD_LOT_NOT_FOUND',
  FIELD_LOT_ORIGIN_INVALID_COUNTRY: 'FIELD_LOT_ORIGIN_INVALID_COUNTRY',
  FIELD_LOT_ORIGIN_INVALID_REGION: 'FIELD_LOT_ORIGIN_INVALID_REGION',
  FIELD_LOT_ORIGIN_INVALID_PROVINCE: 'FIELD_LOT_ORIGIN_INVALID_PROVINCE',
  FIELD_LOT_ORIGIN_INVALID_COMUNE: 'FIELD_LOT_ORIGIN_INVALID_COMUNE',
  FIELD_LOT_ORIGIN_INCOHERENT_REGION: 'FIELD_LOT_ORIGIN_INCOHERENT_REGION',
  FIELD_LOT_ORIGIN_INCOHERENT_PROVINCE: 'FIELD_LOT_ORIGIN_INCOHERENT_PROVINCE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const MESSAGE_TO_CODE: Record<string, ErrorCode> = {
  'User not found': ErrorCodes.AUTH_USER_NOT_FOUND,
  'Invalid password': ErrorCodes.AUTH_INVALID_PASSWORD,
  'User account is disabled': ErrorCodes.AUTH_USER_DISABLED,
  'Invalid refresh token': ErrorCodes.AUTH_INVALID_REFRESH_TOKEN,
  'Token has been revoked': ErrorCodes.AUTH_REFRESH_REVOKED,
  'User with this username already exists': ErrorCodes.USER_ALREADY_EXISTS,
  'You cannot deactivate your own account': ErrorCodes.USER_SELF_ADMIN_DEACTIVATE,
  'Cannot deactivate the last active admin': ErrorCodes.USER_LAST_ACTIVE_ADMIN_DEACTIVATE,
  'You cannot change your own admin role': ErrorCodes.USER_SELF_ADMIN_ROLE_CHANGE,
  'Cannot remove the last active admin role': ErrorCodes.USER_LAST_ACTIVE_ADMIN_ROLE_CHANGE,
  'You cannot delete your own account': ErrorCodes.USER_SELF_DELETE,
  'Cannot delete the last active admin': ErrorCodes.USER_LAST_ACTIVE_ADMIN_DELETE,
  'FieldLot with this lotCode already exists': ErrorCodes.FIELD_LOT_DUPLICATE_CODE,
  'originCountryCode is not a valid ISO country code': ErrorCodes.FIELD_LOT_ORIGIN_INVALID_COUNTRY,
  'originRegion is not a valid Italian region ISTAT code': ErrorCodes.FIELD_LOT_ORIGIN_INVALID_REGION,
  'originProvince is not a valid Italian province ISTAT code': ErrorCodes.FIELD_LOT_ORIGIN_INVALID_PROVINCE,
  'originComune is not a valid Italian comune ISTAT code': ErrorCodes.FIELD_LOT_ORIGIN_INVALID_COMUNE,
  'originProvince is not coherent with originRegion': ErrorCodes.FIELD_LOT_ORIGIN_INCOHERENT_REGION,
  'originComune is not coherent with originRegion': ErrorCodes.FIELD_LOT_ORIGIN_INCOHERENT_REGION,
  'originComune is not coherent with originProvince': ErrorCodes.FIELD_LOT_ORIGIN_INCOHERENT_PROVINCE,
};

export function resolveErrorCode(options: {
  status: number;
  message?: string;
  error?: string;
}): ErrorCode {
  const normalizedMessage = options.message?.trim();
  if (normalizedMessage && MESSAGE_TO_CODE[normalizedMessage]) {
    return MESSAGE_TO_CODE[normalizedMessage];
  }

  if (normalizedMessage?.includes('with ID') && normalizedMessage.includes('not found')) {
    if (normalizedMessage.startsWith('User ')) {
      return ErrorCodes.USER_NOT_FOUND;
    }
    if (normalizedMessage.startsWith('FieldLot ')) {
      return ErrorCodes.FIELD_LOT_NOT_FOUND;
    }
    return ErrorCodes.RESOURCE_NOT_FOUND;
  }

  switch (options.status) {
    case 400:
      return options.error === 'Bad Request' && normalizedMessage?.includes('must be')
        ? ErrorCodes.VALIDATION_ERROR
        : ErrorCodes.BAD_REQUEST;
    case 401:
      return ErrorCodes.UNAUTHORIZED;
    case 403:
      return ErrorCodes.FORBIDDEN;
    case 404:
      return ErrorCodes.RESOURCE_NOT_FOUND;
    case 409:
      return ErrorCodes.CONFLICT;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}
