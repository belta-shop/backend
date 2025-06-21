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
