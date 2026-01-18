

export const BiDashboard = () => {
    const dashboardUrl = import.meta.env.VITE_BI_DASHBOARD_URL;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-4 border-b bg-background">
                <h1 className="text-2xl font-bold">Business Intelligence Dashboard</h1>
            </div>
            <div className="flex-1 bg-muted/20 p-4">
                <div className="w-full h-full rounded-lg overflow-hidden border bg-background shadow-sm">
                    <iframe 
                        src={dashboardUrl} 
                        title="BI Dashboard"
                        className="w-full h-full border-0"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
};
