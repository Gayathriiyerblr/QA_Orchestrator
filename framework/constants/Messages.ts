/**
 * Messages.ts — centralized user-facing messages and log strings.
 * Keeps assertion/log text consistent across every website.
 */

export const Messages = {
  LOGIN: {
    SUCCESS: 'Login succeeded',
    FAILURE: 'Login failed',
    INVALID_CREDENTIALS: 'Invalid username or password',
  },
  NAVIGATION: {
    PAGE_LOADED: 'Page loaded successfully',
    PAGE_LOAD_FAILED: 'Page failed to load',
  },
  EMPLOYEE: {
    CREATED: 'Employee created successfully',
    CREATION_FAILED: 'Employee creation failed',
  },
  LEAVE: {
    SUBMITTED: 'Leave request submitted successfully',
    SUBMISSION_FAILED: 'Leave request submission failed',
  },
  CART: {
    ADDED: 'Product added to cart',
    ADD_FAILED: 'Failed to add product to cart',
    EMPTY: 'Cart is empty',
  },
} as const;
