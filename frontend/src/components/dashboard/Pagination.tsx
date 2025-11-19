/**
 * Pagination Component
 *
 * Handles pagination controls for article lists
 */

import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '@/config/site';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;

    const handleFocus = () => {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    };

    const handleBlur = () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (select.contains(e.target as Node)) return;
      select.blur();
    };

    select.addEventListener('focus', handleFocus);
    select.addEventListener('blur', handleBlur);
    select.addEventListener('change', handleBlur);
    document.addEventListener('click', handleClick);

    return () => {
      select.removeEventListener('focus', handleFocus);
      select.removeEventListener('blur', handleBlur);
      select.removeEventListener('change', handleBlur);
      document.removeEventListener('click', handleClick);
      // Cleanup in case component unmounts while select is focused
      handleBlur();
    };
  }, []);
  if (totalPages <= 1 && !onPageSizeChange) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pagination">
      <div className="pagination-info">
        <span>Showing {startItem}-{endItem} of {totalItems} articles</span>
        {onPageSizeChange && (
          <div className="pagination-page-size">
            <label htmlFor="pageSize">Show:</label>
            <select
              ref={selectRef}
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
            >
              {SITE_CONFIG.pagination.pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              className={`pagination-button page-number ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="pagination-ellipsis">
              {page}
            </span>
          )
        ))}

        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
