import { Request, Response } from 'express';
import { userService } from './user.service';

export const getProfile = async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.user!.userId);
  res.status(200).json({
    success: true,
    status: 'success',
    data: { user },
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.userId, req.body);
  res.status(200).json({
    success: true,
    status: 'success',
    data: { user },
    message: 'Profile updated successfully',
  });
};

export const getAddresses = async (req: Request, res: Response) => {
  const addresses = await userService.getAddresses(req.user!.userId);
  res.status(200).json({
    status: 'success',
    data: { addresses },
  });
};

export const addAddress = async (req: Request, res: Response) => {
  const address = await userService.addAddress(req.user!.userId, req.body);
  res.status(201).json({
    status: 'success',
    data: { address },
  });
};

export const updateAddress = async (req: Request, res: Response) => {
  const address = await userService.updateAddress(req.user!.userId, req.params.id as string, req.body);
  res.status(200).json({
    status: 'success',
    data: { address },
  });
};

export const deleteAddress = async (req: Request, res: Response) => {
  await userService.deleteAddress(req.user!.userId, req.params.id as string);
  res.status(204).send();
};
