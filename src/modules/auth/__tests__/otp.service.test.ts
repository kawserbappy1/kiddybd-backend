import { OTPService } from '../otp.service';
import { redis } from '../../../config/redis';

jest.mock('../../../config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    del: jest.fn(),
  }
}));

describe('OTPService', () => {
  let otpService: OTPService;

  beforeEach(() => {
    otpService = new OTPService();
    jest.clearAllMocks();
  });

  it('should store OTP and enforce cooldown', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null); // Not on cooldown
    
    const otp = await otpService.storeOTP('phone', '01711223344');
    expect(otp).toMatch(/^\d{6}$/);
    expect(redis.set).toHaveBeenCalledTimes(3); // set otp, reset attempts, set cooldown
  });

  it('should throw error if requested on cooldown', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce('1'); // On cooldown
    
    await expect(otpService.storeOTP('phone', '01711223344')).rejects.toThrow('Please wait before requesting another OTP');
  });

  it('should verify OTP successfully', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce('123456');
    (redis.incr as jest.Mock).mockResolvedValueOnce(1); // 1st attempt

    const result = await otpService.verifyOTP('phone', '01711223344', '123456');
    expect(result).toBe(true);
    expect(redis.del).toHaveBeenCalledTimes(2); // delete otp and attempts
  });

  it('should block after 5 failed attempts', async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce('123456');
    (redis.incr as jest.Mock).mockResolvedValueOnce(6); // 6th attempt

    await expect(otpService.verifyOTP('phone', '01711223344', '654321')).rejects.toThrow('Too many failed attempts');
  });
});
