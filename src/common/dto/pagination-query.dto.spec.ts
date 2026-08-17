import { paginate, pageSlice, unwrapFacet } from './pagination-query.dto';

describe('pagination helpers', () => {
  it('derives page metadata from the total', async () => {
    const result = await paginate(
      Promise.resolve([1, 2, 3]),
      Promise.resolve(25),
      2,
      10,
    );
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('skips whole pages, never partial ones', () => {
    expect(pageSlice(1, 10)).toEqual([{ $skip: 0 }, { $limit: 10 }]);
    expect(pageSlice(3, 10)).toEqual([{ $skip: 20 }, { $limit: 10 }]);
  });

  it('reads the count out of a $facet result', () => {
    expect(
      unwrapFacet({ data: [{ _id: 'chess' }], total: [{ value: 9 }] }, 1, 3),
    ).toEqual({
      data: [{ _id: 'chess' }],
      meta: { page: 1, limit: 3, total: 9, totalPages: 3 },
    });
  });

  it('treats an empty $facet branch as zero results', () => {
    // $count emits nothing when the pipeline matched no documents, so the
    // total branch comes back as [] rather than [{ value: 0 }].
    expect(unwrapFacet({ data: [], total: [] }, 1, 10).meta).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('survives an aggregation that returned no facet document at all', () => {
    expect(unwrapFacet(undefined, 1, 10).data).toEqual([]);
  });
});
