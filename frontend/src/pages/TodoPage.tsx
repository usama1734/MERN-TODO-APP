import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import {
  clearSession,
  getCurrentUser,
  getToken,
  updateCurrentUser,
  uploadProfileImage,
} from '../services/AuthService';
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  type TodoQueryParams,
} from '../services/TodoService';
import { Todo } from '../types';

type CompletedFilter = 'all' | 'completed' | 'pending';
type SortBy = 'createdAt' | 'title' | 'completed';
type SortOrder = 'asc' | 'desc';

const TodoPage = () => {
  const navigate = useNavigate();
  const token = getToken();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTodos, setTotalTodos] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');

  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [order, setOrder] = useState<SortOrder>('desc');

  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string>('');

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const queryParams: TodoQueryParams = useMemo(() => {
    const params: TodoQueryParams = {
      page,
      limit: pageSize,
      sortBy,
      order,
    };
    if (q) params.q = q;
    if (completedFilter !== 'all') params.completed = completedFilter === 'completed';
    return params;
  }, [page, pageSize, q, completedFilter, sortBy, order]);

  const loadTodos = async () => {
    try {
      if (!token) return;
      setIsLoading(true);
      setLastError('');
      const data = await fetchTodos(token, queryParams);
      setTodos(data.items);
      setTotalPages(data.meta.totalPages);
      setTotalTodos(data.meta.total);
    } catch (error) {
      setLastError('Failed to load todos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q, completedFilter, sortBy, order]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const openModal = (todo?: Todo) => {
    setSelectedTodo(todo || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedTodo(null);
    setShowModal(false);
  };

  const matchesCurrentView = (todo: Todo) => {
    const completed = !!todo.completed;
    if (completedFilter !== 'all') {
      const desired = completedFilter === 'completed';
      if (completed !== desired) return false;
    }
    if (q) {
      const needle = q.toLowerCase();
      const title = (todo.title || '').toLowerCase();
      const desc = (todo.description || '').toLowerCase();
      if (!title.includes(needle) && !desc.includes(needle)) return false;
    }
    return true;
  };

  const recalcPaginationAfterDelta = (deltaTotal: number) => {
    setTotalTodos((prev) => {
      const next = Math.max(prev + deltaTotal, 0);
      setTotalPages(Math.max(Math.ceil(next / pageSize), 1));
      return next;
    });
  };

  const handleAddOrUpdate = async (todo: Todo) => {
    if (!token) return;

    try {
      if (!todo._id) {
        const created = await createTodo(todo, token);
        const shouldOptimisticallyInsert =
          page === 1 && sortBy === 'createdAt' && order === 'desc' && matchesCurrentView(created);

        if (shouldOptimisticallyInsert) {
          setTodos((prev) => [created, ...prev].slice(0, pageSize));
          recalcPaginationAfterDelta(1);
        } else {
          await loadTodos();
        }
        return;
      }

      const updated = await updateTodo(todo, token);
      setTodos((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t)).filter((t) => matchesCurrentView(t)),
      );

      // Ordering can change depending on sort; reload for correctness.
      if (sortBy !== 'createdAt' || !matchesCurrentView(updated)) {
        await loadTodos();
      }
    } catch (error) {
      console.error('Failed to save todo:', error);
      await loadTodos();
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !token) return;

    const prevTodos = todos;
    const wasLastItemOnPage = prevTodos.length === 1;

    // Optimistic remove
    setTodos((prev) => prev.filter((t) => t._id !== id));
    recalcPaginationAfterDelta(-1);

    try {
      await deleteTodo(id, token);
      if (wasLastItemOnPage && page > 1) {
        setPage((p) => p - 1);
        return; // load will happen from useEffect
      }
      await loadTodos(); // fill the gap from next page
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setTodos(prevTodos);
      await loadTodos();
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    if (!todo._id || !token) return;

    const optimisticCompleted = !todo.completed;
    const prevTodos = todos;

    // Optimistic toggle
    setTodos((prev) =>
      prev
        .map((t) => (t._id === todo._id ? { ...t, completed: optimisticCompleted } : t))
        .filter((t) => matchesCurrentView(t)),
    );

    try {
      await updateTodo({ ...todo, completed: optimisticCompleted }, token);
      // Re-fetch if sort or filters can change ordering/visibility.
      if (sortBy !== 'createdAt' || completedFilter !== 'all' || q) {
        await loadTodos();
      }
    } catch (error) {
      console.error('Failed to toggle todo status:', error);
      setTodos(prevTodos);
      await loadTodos();
    }
  };

  const handleProfileImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    try {
      const updatedUser = await uploadProfileImage(token, file);
      setCurrentUser(updatedUser);
      updateCurrentUser(updatedUser);
    } catch (error) {
      console.error('Failed to upload profile image:', error);
    }
  };

  const resolveProfileImage = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  const resetFilters = () => {
    setSearchInput('');
    setCompletedFilter('all');
    setSortBy('createdAt');
    setOrder('desc');
    setPageSize(10);
    setPage(1);
  };

  return (
    <div className='min-h-screen w-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex flex-col p-6 md:p-10'>
      <div className='w-full flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6'>
        <div>
          <h1 className='text-4xl md:text-5xl font-bold text-white'>Todo App</h1>
          <div className='mt-3 flex items-center gap-3'>
            {currentUser?.profileImageUrl ? (
              <img
                src={resolveProfileImage(currentUser.profileImageUrl)}
                alt='Profile'
                className='w-12 h-12 rounded-full object-cover border-2 border-white'
              />
            ) : (
              <div className='w-12 h-12 rounded-full bg-white/30 border-2 border-white' />
            )}
            <div>
              <p className='text-white/90'>Welcome, {currentUser?.name || currentUser?.email}</p>
              <label className='text-xs text-white/80 cursor-pointer underline'>
                Upload profile image
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleProfileImageUpload}
                />
              </label>
            </div>
          </div>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={() => openModal()}
            className='bg-gradient-to-r from-teal-400 to-teal-600 text-white p-4 rounded-full shadow-lg hover:from-teal-500 hover:to-teal-700 transition duration-300 cursor-pointer'
          >
            Add New Todo
          </button>
          <button
            onClick={() => {
              clearSession();
              navigate('/login');
            }}
            className='bg-white text-gray-800 p-4 rounded-full shadow-lg hover:bg-gray-100 transition duration-300 cursor-pointer'
          >
            Logout
          </button>
        </div>
      </div>

      <div className='w-full bg-white/10 border border-white/20 rounded-2xl p-4 mb-5'>
        <div className='flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4'>
          <div className='flex-1'>
            <label className='text-xs text-white/80'>Search</label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Search title or description...'
              className='w-full mt-1 bg-white/90 rounded-xl px-4 py-3 outline-none'
            />
          </div>

          <div>
            <label className='text-xs text-white/80'>Status</label>
            <select
              value={completedFilter}
              onChange={(e) => {
                setCompletedFilter(e.target.value as CompletedFilter);
                setPage(1);
              }}
              className='w-full mt-1 bg-white/90 rounded-xl px-4 py-3 outline-none'
            >
              <option value='all'>All</option>
              <option value='completed'>Completed</option>
              <option value='pending'>Pending</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-white/80'>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortBy);
                setPage(1);
              }}
              className='w-full mt-1 bg-white/90 rounded-xl px-4 py-3 outline-none'
            >
              <option value='createdAt'>Created</option>
              <option value='title'>Title</option>
              <option value='completed'>Completion</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-white/80'>Order</label>
            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value as SortOrder);
                setPage(1);
              }}
              className='w-full mt-1 bg-white/90 rounded-xl px-4 py-3 outline-none'
            >
              <option value='desc'>Desc</option>
              <option value='asc'>Asc</option>
            </select>
          </div>

          <div>
            <label className='text-xs text-white/80'>Page size</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className='w-full mt-1 bg-white/90 rounded-xl px-4 py-3 outline-none'
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            type='button'
            onClick={resetFilters}
            className='lg:ml-auto px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white transition'
          >
            Reset
          </button>
        </div>
      </div>

      <div className='w-full flex-1 overflow-auto'>
        {lastError ? <div className='text-white mb-3'>{lastError}</div> : null}
        <table className='w-full table-auto bg-white shadow-lg rounded-2xl overflow-hidden'>
          <thead className='bg-gray-100'>
            <tr className='text-gray-700'>
              <th className='py-4 px-4 text-center font-semibold w-16'>Done</th>
              <th className='py-4 px-6 text-left font-semibold'>Title</th>
              <th className='py-4 px-6 text-left font-semibold'>Description</th>
              <th className='py-4 px-6 text-center font-semibold'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className='py-8 text-center text-gray-500'>
                  Loading...
                </td>
              </tr>
            ) : todos?.length === 0 ? (
              <tr>
                <td colSpan={4} className='py-8 text-center text-gray-500'>
                  No Data Found
                </td>
              </tr>
            ) : (
              todos?.map((todo, index) => (
                <tr
                  key={todo._id}
                  className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : ''} ${
                    todo.completed ? 'opacity-75' : ''
                  }`}
                >
                  <td className='py-4 px-4 text-center'>
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      className={`w-7 h-7 rounded-full border-2 inline-flex items-center justify-center transition ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 text-transparent hover:border-green-500'
                      }`}
                      aria-label={
                        todo.completed ? 'Mark task as incomplete' : 'Mark task as complete'
                      }
                    >
                      ✓
                    </button>
                  </td>
                  <td className={`py-4 px-6 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.title}
                  </td>
                  <td className={`py-4 px-6 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.description}
                  </td>
                  <td className='py-4 px-6 flex justify-center space-x-4'>
                    <button
                      onClick={() => openModal(todo)}
                      className='bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-full transition duration-300 cursor-pointer'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(todo._id)}
                      className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full transition duration-300 cursor-pointer'
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white'>
        <p className='text-sm'>Total todos: {totalTodos}</p>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className='px-3 py-2 rounded-lg bg-white/20 disabled:opacity-40'
          >
            Previous
          </button>
          <span className='text-sm'>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            className='px-3 py-2 rounded-lg bg-white/20 disabled:opacity-40'
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <Modal
          closeModal={closeModal}
          todo={selectedTodo || undefined}
          onSubmit={handleAddOrUpdate}
        />
      )}
    </div>
  );
};

export default TodoPage;
