import { Context } from 'hono';
import { PreRequestValidatorService } from '../../../../../src/handlers/services/preRequestValidatorService';
import { RequestContext } from '../../../../../src/handlers/services/requestContext';

describe('PreRequestValidatorService', () => {
  let mockContext: Context;
  let mockRequestContext: RequestContext;
  let preRequestValidatorService: PreRequestValidatorService;

  beforeEach(() => {
    mockContext = {
      get: jest.fn(),
    } as unknown as Context;

    mockRequestContext = {
      providerOption: { provider: 'openai' },
      requestHeaders: { authorization: 'Bearer sk-test' },
      params: { model: 'gpt-4', messages: [] },
    } as unknown as RequestContext;
  });

  describe('constructor', () => {
    it('should initialize with context and request context', () => {
      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );
      expect(preRequestValidatorService).toBeInstanceOf(
        PreRequestValidatorService
      );
      expect(mockContext.get).toHaveBeenCalledWith('preRequestValidator');
    });
  });

  describe('getResponse', () => {
    it('should return undefined when no validator is set', async () => {
      (mockContext.get as jest.Mock).mockReturnValue(undefined);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      const result = await preRequestValidatorService.getResponse();

      expect(result).toEqual({
        response: undefined,
        modelPricingConfig: undefined,
      });
      expect(mockContext.get).toHaveBeenCalledWith('preRequestValidator');
    });

    it('should call validator with correct parameters when validator exists', async () => {
      const validatorResponse = new Response('{"error": "Validation failed"}', {
        status: 400,
      });
      const mockValidator = jest.fn().mockResolvedValue({
        response: validatorResponse,
        modelPricingConfig: undefined,
      });
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      const result = await preRequestValidatorService.getResponse();

      expect(mockValidator).toHaveBeenCalledWith(
        mockContext,
        mockRequestContext.providerOption,
        mockRequestContext.requestHeaders,
        mockRequestContext.params
      );
      expect(result.response).toBeInstanceOf(Response);
      expect(result.response!.status).toBe(400);
    });

    it('should return validator response when validation fails', async () => {
      const errorResponse = new Response(
        JSON.stringify({
          error: {
            message: 'Budget exceeded',
            type: 'budget_exceeded',
          },
        }),
        {
          status: 429,
          headers: { 'content-type': 'application/json' },
        }
      );
      const mockValidator = jest.fn().mockResolvedValue({
        response: errorResponse,
        modelPricingConfig: { cost: 0.001 },
      });
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      const result = await preRequestValidatorService.getResponse();

      expect(result.response).toBe(errorResponse);
      expect(result.response!.status).toBe(429);
      expect(result.modelPricingConfig).toEqual({ cost: 0.001 });
    });

    it('should return undefined when validator passes (returns null)', async () => {
      const mockValidator = jest.fn().mockResolvedValue(null);
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      const result = await preRequestValidatorService.getResponse();

      expect(mockValidator).toHaveBeenCalled();
      expect(result).toEqual({
        response: undefined,
        modelPricingConfig: undefined,
      });
    });

    it('should return undefined when validator passes (returns undefined)', async () => {
      const mockValidator = jest.fn().mockResolvedValue(undefined);
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      const result = await preRequestValidatorService.getResponse();

      expect(mockValidator).toHaveBeenCalled();
      expect(result).toEqual({
        response: undefined,
        modelPricingConfig: undefined,
      });
    });

    it('should handle validator that throws an error', async () => {
      const mockValidator = jest
        .fn()
        .mockRejectedValue(new Error('Validator error'));
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      await expect(preRequestValidatorService.getResponse()).rejects.toThrow(
        'Validator error'
      );
      expect(mockValidator).toHaveBeenCalledWith(
        mockContext,
        mockRequestContext.providerOption,
        mockRequestContext.requestHeaders,
        mockRequestContext.params
      );
    });

    it('should handle async validator correctly', async () => {
      const validatorResponse = new Response('{"status": "validated"}', {
        status: 200,
      });
      const delayedResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            response: validatorResponse,
            modelPricingConfig: { model: 'test' },
          });
        }, 10);
      });
      const mockValidator = jest.fn().mockReturnValue(delayedResponse);
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      preRequestValidatorService = new PreRequestValidatorService(
        mockContext,
        mockRequestContext
      );

      const result = await preRequestValidatorService.getResponse();

      expect(result.response).toBeInstanceOf(Response);
      expect(result.response!.status).toBe(200);
      expect(result.modelPricingConfig).toEqual({ model: 'test' });
    });

    it('should pass correct parameters for different request contexts', async () => {
      const customRequestContext = {
        providerOption: {
          provider: 'anthropic',
          apiKey: 'sk-ant-test',
          customParam: 'value',
        },
        requestHeaders: {
          authorization: 'Bearer sk-ant-test',
          'anthropic-version': '2023-06-01',
        },
        params: {
          model: 'claude-3-sonnet',
          max_tokens: 1000,
          messages: [{ role: 'user', content: 'Hello' }],
        },
      } as unknown as RequestContext;

      const mockValidator = jest.fn().mockResolvedValue(null);
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      const customService = new PreRequestValidatorService(
        mockContext,
        customRequestContext
      );

      const result = await customService.getResponse();

      expect(mockValidator).toHaveBeenCalledWith(
        mockContext,
        customRequestContext.providerOption,
        customRequestContext.requestHeaders,
        customRequestContext.params
      );
      expect(result).toEqual({
        response: undefined,
        modelPricingConfig: undefined,
      });
    });

    it('should handle empty request parameters', async () => {
      const emptyRequestContext = {
        providerOption: {},
        requestHeaders: {},
        params: {},
      } as unknown as RequestContext;

      const mockValidator = jest.fn().mockResolvedValue(null);
      (mockContext.get as jest.Mock).mockReturnValue(mockValidator);

      const emptyService = new PreRequestValidatorService(
        mockContext,
        emptyRequestContext
      );

      const result = await emptyService.getResponse();

      expect(mockValidator).toHaveBeenCalledWith(mockContext, {}, {}, {});
      expect(result).toEqual({
        response: undefined,
        modelPricingConfig: undefined,
      });
    });
  });
});
