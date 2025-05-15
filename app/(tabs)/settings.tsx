import { Link } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

const settings = () => {
  return (
    <View className='flex-1 justify-center items-center'>
        <Link href="/sign-in">Sign in</Link>
    </View>
  )
}

export default settings