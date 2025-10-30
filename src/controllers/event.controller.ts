import { Response } from 'express';
import { IPaginataionQuery, IReqUser } from '../utils/interface';
import response from '../utils/response';
import EventModel, { eventDAO, TEvent } from '../models/event.model';
import { FilterQuery } from 'mongoose';

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const payload = { ...req.body, createdBy: req.user?.id } as TEvent;
      await eventDAO.validate(payload);
      const result = await EventModel.create(payload);
      response.success(res, result, 'success create an event');
    } catch (error) {
      response.error(res, error, 'failed to create event');
    }
  },
  async findAll(req: IReqUser, res: Response) {
    try {
      const {
        limit = 10,
        page = 1,
        search,
      } = req.query as unknown as IPaginataionQuery;

      const query: FilterQuery<TEvent> = {};
      if (search) {
        Object.assign(query, {
          ...query,
          $text: {
            $search: search,
          },
        });
      }

      const result = await EventModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await EventModel.countDocuments(query);

      response.pagination(
        res,
        result,
        {
          current: page,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
        ' success get all events'
      );
    } catch (error) {
      response.error(res, error, 'failed to find All event');
    }
  },
  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await EventModel.findById(id);
      response.success(res, result, 'success find one event');
    } catch (error) {
      response.error(res, error, 'failed to find one event');
    }
  },
  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await EventModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      response.success(res, result, 'success update an event');
    } catch (error) {
      response.error(res, error, 'failed to update event');
    }
  },
  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await EventModel.findByIdAndDelete(id, { new: true });
      response.success(res, result, 'success remove one event');
    } catch (error) {
      response.error(res, error, 'failed to remove event');
    }
  },
  async findOneBySlug(req: IReqUser, res: Response) {
    try {
      const { slug } = req.params;
      const result = await EventModel.findOne({ slug });
      response.success(res, result, 'success find one by slug event');
    } catch (error) {
      response.error(res, error, 'failed to find event by slug event');
    }
  },
};
