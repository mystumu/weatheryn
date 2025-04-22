export const config = {
  vapid: {
    publicKey: 'BEutLMYnBOGmp2K-KACo2Wmd-Lo-9XVaoOlVvraq78t1jLYoQjNKF6sHTCofCiuFuNQA1yyF-bd_FVXSZZfbUrw',
    privateKey: 'uhtVEopkMny2GKR6nSZwoJ-XCH4bgL-feduPgTKaJGI'
  },
  pushNotifications: {
    enabled: true,
    defaultOptions: {
      userVisibleOnly: true,
      silent: false
    }
  },
  serviceWorker: {
    scope: '/',
    updateInterval: 24 * 60 * 60 * 1000 // 24 horas
  }
}; 