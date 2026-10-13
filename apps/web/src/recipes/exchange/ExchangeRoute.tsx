import { useActionData, useNavigation } from 'react-router'
import type { ImportResult } from './exchangeActions'
import ExchangePage from './ExchangePage'

function ExchangeRoute() {
  const result = useActionData<ImportResult>()
  const navigation = useNavigation()

  return (
    <ExchangePage result={result} importing={navigation.state !== 'idle'} />
  )
}

export default ExchangeRoute
