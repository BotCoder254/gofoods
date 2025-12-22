/* Suppress console warnings in production */
if (process.env.NODE_ENV === 'production') {
  console.warn = () => {}
  console.error = () => {}
  console.log = () => {}
}

export {}
