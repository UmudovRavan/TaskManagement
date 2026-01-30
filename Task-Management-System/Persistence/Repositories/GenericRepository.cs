using Domain.Entities;
using Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using System;
using System.Collections.Generic;
using System.Text;

namespace Persistence.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity, new()
    {
        private readonly AppDbContext _context;
        private readonly DbSet<T> _dbSet;


        public GenericRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task<T> AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);

            return entity;

        }

        public async Task<T> DeleteAsync(int id)
        {
            var entity = await _dbSet.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                throw new Exception("Entity not found");



            entity.IsDeleted = true;
            _dbSet.Update(entity);

            return entity;
        }

        public async Task<List<T>> GetAllAsync(
      Func<IQueryable<T>, IQueryable<T>> include = null)
        {
            IQueryable<T> query = _dbSet
                .AsNoTracking()
                .Where(e => !e.IsDeleted);

            if (include != null)
                query = include(query);

            return await query.ToListAsync();
        }

        public async Task<T?> GetByIdAsync(int id, Func<IQueryable<T>, IQueryable<T>>? include = null)
        {
            IQueryable<T> query = _context.Set<T>();

            if (include != null)
                query = include(query);

            return await query.FirstOrDefaultAsync(x => x.Id == id);
        }


        public async Task<T> UpdateAsync(T entity)
        {

            var existingEntity = await _dbSet.FindAsync(entity.Id);
            if (existingEntity == null)
                throw new Exception("Entity tapılmadı");

            _context.Entry(existingEntity).CurrentValues.SetValues(entity);
            await _context.SaveChangesAsync();


            return existingEntity;
        }
    }
}
