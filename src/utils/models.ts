export function getAggregatedLookup(
  items: {
    collection: string;
    fieldName: string;
    isArray: boolean;
  }[]
) {
  const pipline: any[] = [];

  items.map(({ collection, fieldName, isArray }) => {
    pipline.push({
      $lookup: {
        from: collection,
        localField: fieldName,
        foreignField: "_id",
        as: fieldName,
      },
    });

    if (!isArray) {
      pipline.push({
        $unwind: {
          path: `$${fieldName}`,
          preserveNullAndEmptyArrays: true,
        },
      });
    }
  });

  return pipline;
}

export function getPaginationPipline({
  skip,
  limit,
  beforePipline = [],
  dataPipline = [],
}: {
  skip: number;
  limit: number;
  beforePipline?: any[];
  dataPipline?: any[];
}) {
  return [
    ...beforePipline,
    {
      $facet: {
        metadata: [
          { $count: "total" },
          { $addFields: { page: skip / limit + 1, limit } },
        ],
        data: [{ $skip: skip }, { $limit: limit }, ...dataPipline],
      },
    },
    { $unwind: "$metadata" },
    {
      $project: {
        data: 1,
        metadata: 1,
      },
    },
  ];
}
