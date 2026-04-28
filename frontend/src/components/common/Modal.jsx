import React, { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Modal = ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} transform transition-all`}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-neutral-tertiary">
              <h3 className="text-lg font-semibold">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-neutral-secondary transition"
                >
                  <XMarkIcon className="w-5 h-5 text-neutral-mid-gray" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal