## Documentazione API Analytics

### 1. **Clicks - Totale**
   - **Path**: `/api/analytics/clicks/total`
   - **Metodo**: `GET`
   - **Handler**: `getTotalClicks`
   - **Supporto per Bulk**: `Sì`

### 2. **Clicks - Gruppo per Target**
   - **Path**: `/api/analytics/clicks/groupby/target`
   - **Metodo**: `GET`
   - **Handler**: `getClicksByTarget`
   - **Supporto per Bulk**: `Sì`

### 3. **Clicks - Giornaliero**
   - **Path**: `/api/analytics/clicks/daily`
   - **Metodo**: `GET`
   - **Handler**: `getDailyClicks`
   - **Supporto per Bulk**: `Sì`

---

### 4. **Purchases - Totale**
   - **Path**: `/api/analytics/purchases/total`
   - **Metodo**: `GET`
   - **Handler**: `getTotalPurchases`
   - **Supporto per Bulk**: `Sì`

### 5. **Purchases - Gruppo per Device**
   - **Path**: `/api/analytics/purchases/groupby/device`
   - **Metodo**: `GET`
   - **Handler**: `createGetPurchasesByGroup('device')`
   - **Supporto per Bulk**: `Sì`

### 6. **Purchases - Gruppo per Browser**
   - **Path**: `/api/analytics/purchases/groupby/browser`
   - **Metodo**: `GET`
   - **Handler**: `createGetPurchasesByGroup('browser')`
   - **Supporto per Bulk**: `Sì`

### 7. **Purchases - Gruppo per Prodotto**
   - **Path**: `/api/analytics/purchases/groupby/product`
   - **Metodo**: `GET`
   - **Handler**: `createGetPurchasesByGroup('product')`
   - **Supporto per Bulk**: `Sì`

### 8. **Purchases - Gruppo per Brand**
   - **Path**: `/api/analytics/purchases/groupby/brand`
   - **Metodo**: `GET`
   - **Handler**: `createGetPurchasesByGroup('brand')`
   - **Supporto per Bulk**: `Sì`

### 9. **Purchases - Gruppo per Categoria**
   - **Path**: `/api/analytics/purchases/groupby/category`
   - **Metodo**: `GET`
   - **Handler**: `createGetPurchasesByGroup('category')`
   - **Supporto per Bulk**: `Sì`

### 10. **Purchases - Gruppo per Città**
   - **Path**: `/api/analytics/purchases/groupby/city`
   - **Metodo**: `GET`
   - **Handler**: `createGetPurchasesByGroup('city')`
   - **Supporto per Bulk**: `Sì`

### 11. **Purchases - Giornaliero**
   - **Path**: `/api/analytics/purchases/daily`
   - **Metodo**: `GET`
   - **Handler**: `getDailyPurchases`
   - **Supporto per Bulk**: `Sì`

---

### 12. **Realtime - Visitatori**
   - **Path**: `/api/analytics/realtime/visitors`
   - **Metodo**: `GET`
   - **Handler**: `getVisitors`
   - **Supporto per Bulk**: `No`

### 13. **Realtime - Visitatori Ultime 3 Ore**
   - **Path**: `/api/analytics/realtime/visitors/last-3-hours`
   - **Metodo**: `GET`
   - **Handler**: `getVisitorsLast3Hours`
   - **Supporto per Bulk**: `No`

### 14. **Realtime - Visitatori per Paese**
   - **Path**: `/api/analytics/realtime/visitors/groupby/country`
   - **Metodo**: `GET`
   - **Handler**: `createGetVisitorsByGroup('geo.country')`
   - **Supporto per Bulk**: `No`

### 15. **Realtime - Visitatori per Pagina**
   - **Path**: `/api/analytics/realtime/visitors/groupby/page`
   - **Metodo**: `GET`
   - **Handler**: `createGetVisitorsByGroup('page.title')`
   - **Supporto per Bulk**: `No`

### 16. **Realtime - Visitatori per Browser**
   - **Path**: `/api/analytics/realtime/visitors/groupby/browser`
   - **Metodo**: `GET`
   - **Handler**: `createGetVisitorsByGroup('device.browser')`
   - **Supporto per Bulk**: `No`

---

### 17. **Interests - Totale**
   - **Path**: `/api/analytics/interests/total`
   - **Metodo**: `GET`
   - **Handler**: `() => {}` *(Placeholder)*
   - **Supporto per Bulk**: `Sì`

### 18. **Interests - Gruppo per Argomento**
   - **Path**: `/api/analytics/interests/groupby/topic`
   - **Metodo**: `GET`
   - **Handler**: `() => {}` *(Placeholder)*
   - **Supporto per Bulk**: `Sì`

### 19. **Interests - Giornaliero**
   - **Path**: `/api/analytics/interests/daily`
   - **Metodo**: `GET`
   - **Handler**: `() => {}` *(Placeholder)*
   - **Supporto per Bulk**: `Sì`

---

### 20. **Uviews - Totale**
   - **Path**: `/api/analytics/uviews/total`
   - **Metodo**: `GET`
   - **Handler**: `getTotalUViews`
   - **Supporto per Bulk**: `Sì`

### 21. **Uviews - Gruppo per Device**
   - **Path**: `/api/analytics/uviews/groupby/device`
   - **Metodo**: `GET`
   - **Handler**: `createGetUViewsByGroup('device.type')`
   - **Supporto per Bulk**: `Sì`

### 22. **Uviews - Gruppo per Browser**
   - **Path**: `/api/analytics/uviews/groupby/browser`
   - **Metodo**: `GET`
   - **Handler**: `createGetUViewsByGroup('device.browser')`
   - **Supporto per Bulk**: `Sì`

### 23. **Uviews - Gruppo per Sistema Operativo**
   - **Path**: `/api/analytics/uviews/groupby/os`
   - **Metodo**: `GET`
   - **Handler**: `createGetUViewsByGroup('device.os')`
   - **Supporto per Bulk**: `Sì`

### 24. **Uviews - Gruppo per Referrer**
   - **Path**: `/api/analytics/uviews/groupby/referrer`
   - **Metodo**: `GET`
   - **Handler**: `createGetUViewsByGroup('referrer')`
   - **Supporto per Bulk**: `Sì`

### 25. **Uviews - Gruppo per Città**
   - **Path**: `/api/analytics/uviews/groupby/city`
   - **Metodo**: `GET`
   - **Handler**: `createGetUViewsByGroup('geo.city')`
   - **Supporto per Bulk**: `Sì`

### 26. **Uviews - Gruppo per Paese**
   - **Path**: `/api/analytics/uviews/groupby/country`
   - **Metodo**: `GET`
   - **Handler**: `createGetUViewsByGroup('geo.country')`
   - **Supporto per Bulk**: `Sì`

### 27. **Uviews - Giornaliero**
   - **Path**: `/api/analytics/uviews/daily`
   - **Metodo**: `GET`
   - **Handler**: `getDailyUViews`
   - **Supporto per Bulk**: `Sì`

### 28. **Nuovo vs. Ritornante**
   - **Path**: `/api/analytics/uviews/new-returning`
   - **Metodo**: `GET`
   - **Handler**: `getNewReturning`
   - **Supporto per Bulk**: `Sì`

---

### 29. **Views - Totale**
   - **Path**: `/api/analytics/views/total`
   - **Metodo**: `GET`
   - **Handler**: `getTotalViews`
   - **Supporto per Bulk**: `Sì`

### 30. **Views - Gruppo per Device**
   - **Path**: `/api/analytics/views/groupby/device`
   - **Metodo**: `GET`
   - **Handler**: `createGetViewsByGroup('device.type')`
   - **Supporto per Bulk**: `Sì`

### 31. **Views - Gruppo per Browser**
   - **Path**: `/api/analytics/views/groupby/browser`
   - **Metodo**: `GET`
   - **Handler**: `createGetViewsByGroup('device.browser')`
   - **Supporto per Bulk**: `Sì`

### 32. **Views - Gruppo per Sistema Operativo**
   - **Path**: `/api/analytics/views/groupby/os`
   - **Metodo**: `GET`
   - **Handler**: `createGetViewsByGroup('device.os')`
   - **Supporto per Bulk**: `Sì`

### 33. **Views - Gruppo per Referrer**
   - **Path**: `/api/analytics/views/groupby/referrer`
   - **Metodo**: `GET`
   - **Handler**: `createGetViewsByGroup('referrer')`
   - **Supporto per Bulk**: `Sì`

### 34. **Views - Gruppo per Città**
   - **Path**: `/api/analytics/views/groupby/city

`
   - **Metodo**: `GET`
   - **Handler**: `createGetViewsByGroup('geo.city')`
   - **Supporto per Bulk**: `Sì`

### 35. **Views - Gruppo per Paese**
   - **Path**: `/api/analytics/views/groupby/country`
   - **Metodo**: `GET`
   - **Handler**: `createGetViewsByGroup('geo.country')`
   - **Supporto per Bulk**: `Sì`

### 36. **Views - Giornaliero**
   - **Path**: `/api/analytics/views/daily`
   - **Metodo**: `GET`
   - **Handler**: `getDailyViews`
   - **Supporto per Bulk**: `Sì`