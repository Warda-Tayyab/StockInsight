import React from 'react'
import { HashLoader } from 'react-spinners'

const Loading = () => {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background">
            <div className="text-center space-y-4">
                <HashLoader size={50} color="#3b82f6" />
                <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
        </div>
    )
}

export default Loading
