import React from 'react'
import ChangePassword from '@/components/settings/change-password'
import VendorRateSettings from '@/components/settings/vendor-rate-settings'
import { Card, CardContent } from '@/components/ui/card'

type Props = {
  params: Promise<{ // [!code highlight] Update type to Promise
    role: string
    district: string
    id: string
  }>
}

// [!code highlight] Make the component async
const SettingsPage = async ({ params }: Props) => {
  // [!code highlight] Await the params before using them
  const { role } = await params

  return (
    <div className="py-2 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6 space-y-10">
            <ChangePassword />
            {/* [!code highlight] Use the awaited variable */}
            {role === 'contractor' && (
              <>
                <div className="border-t border-gray-200 my-6" />
                <VendorRateSettings />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage