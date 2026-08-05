const { SubscriptionPlan, Tenant } = require('./../associations');
const AppError = require('../../utils/appError');
const { Op } = require('sequelize');

exports.getAllPlans = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      status, 
      billingCycle 
    } = req.query;
    
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (billingCycle) where.billingCycle = billingCycle;

    const { count, rows } = await SubscriptionPlan.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['display_order', 'ASC'], ['created_at', 'DESC']],
      include: [
        {
          model: Tenant,
          as: 'tenants',
          attributes: ['id']
        }
      ]
    });

    const data = rows.map(plan => {
      const planJson = plan.toJSON();
      planJson.assignedCount = plan.tenants ? plan.tenants.length : 0;
      delete planJson.tenants;
      return planJson;
    });

    res.status(200).json({
      status: 'success',
      results: count,
      data,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      throw new AppError('Subscription plan not found', 404);
    }
    res.status(200).json({ status: 'success', data: plan });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    const existing = await SubscriptionPlan.findOne({ where: { code } });
    if (existing) {
      throw new AppError('Plan code must be unique', 400);
    }

    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ status: 'success', data: plan });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      throw new AppError('Subscription plan not found', 404);
    }

    if (req.body.code && req.body.code !== plan.code) {
      const existing = await SubscriptionPlan.findOne({ where: { code: req.body.code } });
      if (existing) {
        throw new AppError('Plan code must be unique', 400);
      }
    }

    await plan.update(req.body);
    res.status(200).json({ status: 'success', data: plan });
  } catch (error) {
    next(error);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id, {
      include: [{ model: Tenant, as: 'tenants', attributes: ['id'] }]
    });

    if (!plan) {
      throw new AppError('Subscription plan not found', 404);
    }

    if (plan.tenants && plan.tenants.length > 0) {
      throw new AppError(`Cannot delete plan: Currently assigned to ${plan.tenants.length} tenant(s)`, 400);
    }

    await plan.destroy();
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
