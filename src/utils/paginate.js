// utils/paginate.js
export const paginate = async ({
  req,
  model,
  filter = {},
  select = "",
  populate = [],
  sort = { createdAt: -1 },
}) => {
  let { page = process.env.PAGE || 1, size = process.env.SIZE || 10 } = req.query;

  page = parseInt(page);
  size = parseInt(size);

  if (page < 1) page = 1;
  if (size < 1) size = 3;

  const skip = (page - 1) * size;

  const [data, total] = await Promise.all([
    model.find(filter).select(select).populate(populate).sort(sort).skip(skip).limit(size),
    model.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    },
  };
};
