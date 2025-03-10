import type { Request, Response } from 'express';

import { userService } from './userService';
import { handleServiceResponse } from '../shared/httpHandlers';

class UserController {
  public findUsers = async (req: Request, res: Response) => {
    const fName: string = req?.body?.fName;
    const lName: string = req?.body?.lName;
    const countOfOwnedCars = req?.body?.countOfOwnedCars;
    const age = req?.body?.age;

    if (age) {
      const serviceResponse = await userService.findByExactAge(age);
      return handleServiceResponse(serviceResponse, res);
    }

    const serviceResponse = await userService.findUsers({
      fName,
      countOfOwnedCars,
      lName,
    });
    return handleServiceResponse(serviceResponse, res);
  };

  public updateCountOfOwnedCarsAndFindUserByExactAge = async (
    req: Request,
    res: Response,
  ) => {
    const id: string = req.params.id;
    const countOfOwnedCars = req?.body?.countOfOwnedCars;
    const age = req?.body?.age;
    const serviceResponse =
      await userService.updateCountOfOwnedCarsAndFindUsersByExactAge({
        id,
        countOfOwnedCars,
        age,
      });

    return handleServiceResponse(serviceResponse, res);
  };

  public findUsersByExactAge = async (req: Request, res: Response) => {
    //TODO adding smart parsing for age
    const age = req?.query?.age;
    const serviceResponse = age
      ? await userService.findByExactAge(age as string)
      : await userService.findUsers({});

    return handleServiceResponse(serviceResponse, res);
  };
}

export const userController = new UserController();
