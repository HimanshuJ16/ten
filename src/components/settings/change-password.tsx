'use client'

import { useChangePassword } from '@/hooks/settings/use-settings'
import React from 'react'
import Section from '../section-label'
import FormGenerator from '../forms/form-generator'
import { Button } from '../ui/button'
import { Loader } from '../loader'

const ChangePassword = () => {
  const { register, errors, onChangePassword, loading, control } = useChangePassword()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Change Password"
          message="Reset your password"
        />
      </div>
      <form
        onSubmit={onChangePassword}
        className="lg:col-span-4"
      >
        <div className="lg:w-[500px] flex flex-col gap-3">
          <FormGenerator
            register={register}
            errors={errors}
            control={control}
            name="oldPassword"
            placeholder="Current Password"
            type="password"
            inputType="input"
          />
          <FormGenerator
            register={register}
            errors={errors}
            control={control}
            name="newPassword"
            placeholder="New Password"
            type="password"
            inputType="input"
          />
          <FormGenerator
            register={register}
            errors={errors}
            control={control}
            name="confirmNewPassword"
            placeholder="Confirm New Password"
            type="password"
            inputType="input"
          />
          <Button type="submit" className="bg-[#7ccff3] text-gray-700 font-semibold">
            <Loader loading={loading}>Change Password</Loader>
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ChangePassword