import { Link } from 'react-router-dom';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  actionLink,
  actionOnClick,
  illustration = 'cart' // cart, orders, search, error
}) {
  const illustrations = {
    cart: (
      <svg className="w-32 h-32 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    orders: (
      <svg className="w-32 h-32 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    search: (
      <svg className="w-32 h-32 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    error: (
      <svg className="w-32 h-32 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      {illustrations[illustration]}
      
      {/* Icon */}
      {Icon && (
        <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-full mb-4">
          <Icon className="text-3xl text-purple-400" />
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {(actionText && (actionLink || actionOnClick)) && (
        actionLink ? (
          <Link 
            to={actionLink}
            className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={actionOnClick}
            className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
}
