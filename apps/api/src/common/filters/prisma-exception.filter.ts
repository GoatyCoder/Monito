import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../../generated/prisma/client';
import { ErrorCode, ErrorCodes } from '../errors/error-codes';

interface ErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    let error = 'Database Error';
    let code: ErrorCode = ErrorCodes.DB_ERROR;

    switch (exception.code) {
      case 'P2000':
        message = 'The provided value for the column is too long';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        code = ErrorCodes.VALIDATION_ERROR;
        break;
      case 'P2001':
        message = 'The record searched for in the where condition does not exist';
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        code = ErrorCodes.DB_RECORD_NOT_FOUND;
        break;
      case 'P2002':
        message = 'A unique constraint would be violated';
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        code = ErrorCodes.DB_UNIQUE_CONSTRAINT;
        break;
      case 'P2003':
        message = 'A foreign key constraint failed';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        code = ErrorCodes.DB_FOREIGN_KEY_CONSTRAINT;
        break;
      case 'P2004':
        message = 'A required constraint is not being provided';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2005':
        message = 'The value stored in the database for the field is invalid';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2006':
        message = 'The provided value is not valid for the field';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2007':
        message = 'The data type of the field does not match the data type of the value';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2008':
        message = 'Failed to parse the query';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2009':
        message = 'Failed to validate the query';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2010':
        message = 'The connection to the database could not be established';
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = 'Service Unavailable';
        break;
      case 'P2011':
        message = 'A constraint check on the relation or model failed';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2012':
        message = 'The required value is not present where it should be';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2013':
        message = 'The required connected record was not found';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2014':
        message = 'The change would violate a required relation or relation';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2015':
        message = 'A related record could not be found';
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        break;
      case ' P2016':
        message = 'The query interpretation failed';
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = 'Internal Server Error';
        break;
      case 'P2017':
        message = 'The records for relation between the models are not connected';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2018':
        message = 'The required connected records are not connected';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2019':
        message = 'Input error';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2020':
        message = 'Value out of range for the field';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2021':
        message = 'The table does not exist in the current database';
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = 'Internal Server Error';
        break;
      case 'P2022':
        message = 'The column does not exist in the current database';
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = 'Internal Server Error';
        break;
      case 'P2023':
        message = 'Inconsistent column data';
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        break;
      case 'P2024':
        message = 'The provided timeout exceeded';
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = 'Service Unavailable';
        break;
      case 'P2025':
        message = 'An operation failed because it depends on one or more records that were required but not found';
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        code = ErrorCodes.DB_RECORD_NOT_FOUND;
        break;
      case 'P2026':
        message = 'The current database provider does not support a feature that the query used';
        status = HttpStatus.NOT_IMPLEMENTED;
        error = 'Not Implemented';
        break;
      case 'P2027':
        message = 'Multiple errors occurred on the database during query execution';
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        error = 'Internal Server Error';
        break;
      default:
        this.logger.error(`Unhandled Prisma error code: ${exception.code}`, exception.stack);
        code = ErrorCodes.DB_ERROR;
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      code,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as Request & { requestId?: string }).requestId,
    };

    response.status(status).json(errorResponse);
  }
}
