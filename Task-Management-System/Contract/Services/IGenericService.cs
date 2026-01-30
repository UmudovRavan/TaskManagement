using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Contract.Services
{
    public interface IGenericService<TVM, TEntity> where TEntity : BaseEntity, new()
    {
        Task<TVM> GetByIdAsync(int id, Func<IQueryable<TEntity>, IQueryable<TEntity>>? include = null);
        Task<IEnumerable<TVM>> GetAllAsync(Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null);
        Task<TVM> AddAsync(TVM entity);
        Task<TVM> UpdateAsync(TVM entity);
        Task<bool> DeleteAsync(int id);

    }
}
