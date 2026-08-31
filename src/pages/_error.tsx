import React from 'react'

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <p style={{ textAlign: 'center', padding: '40px' }}>
      {statusCode
        ? `Un error ${statusCode} ocurrió en el servidor`
        : 'Un error ocurrió en el cliente'}
    </p>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
