import { auth } from '@/lib/auth/config'
import { LoggedInLandingPage } from '@/components/landing-page/logged-in-landing-page'
import { NotLoggedInLandingPage } from '@/components/landing-page/not-logged-in-landing-page'

export default async function Page() {
  // const session = await auth()

  // return session ? <LoggedInLandingPage /> : <NotLoggedInLandingPage />
  return <LoggedInLandingPage></LoggedInLandingPage>
}
