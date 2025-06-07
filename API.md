## Analytics API Documentation

### 1. **Clicks - Total**
   - **Path**: `/api/analytics/clicks/total`
   - **Method**: `GET`
   - **Handler**: `getTotalClicks`
   - **Bulk Support**: `Yes`

### 2. **Clicks - Group by Target**
   - **Path**: `/api/analytics/clicks/groupby/target`
   - **Method**: `GET`
   - **Handler**: `getClicksByTarget`
   - **Bulk Support**: `Yes`

### 3. **Clicks - Daily**
   - **Path**: `/api/analytics/clicks/daily`
   - **Method**: `GET`
   - **Handler**: `getDailyClicks`
   - **Bulk Support**: `Yes`

---

### 4. **Purchases - Total**
   - **Path**: `/api/analytics/purchases/total`
   - **Method**: `GET`
   - **Handler**: `getTotalPurchases`
   - **Bulk Support**: `Yes`

### 5. **Purchases - Group by Device**
   - **Path**: `/api/analytics/purchases/groupby/device`
   - **Method**: `GET`
   - **Handler**: `createGetPurchasesByGroup('device')`
   - **Bulk Support**: `Yes`

### 6. **Purchases - Group by Browser**
   - **Path**: `/api/analytics/purchases/groupby/browser`
   - **Method**: `GET`
   - **Handler**: `createGetPurchasesByGroup('browser')`
   - **Bulk Support**: `Yes`

### 7. **Purchases - Group by Product**
   - **Path**: `/api/analytics/purchases/groupby/product`
   - **Method**: `GET`
   - **Handler**: `createGetPurchasesByGroup('product')`
   - **Bulk Support**: `Yes`

### 8. **Purchases - Group by Brand**
   - **Path**: `/api/analytics/purchases/groupby/brand`
   - **Method**: `GET`
   - **Handler**: `createGetPurchasesByGroup('brand')`
   - **Bulk Support**: `Yes`

### 9. **Purchases - Group by Category**
   - **Path**: `/api/analytics/purchases/groupby/category`
   - **Method**: `GET`
   - **Handler**: `createGetPurchasesByGroup('category')`
   - **Bulk Support**: `Yes`

### 10. **Purchases - Group by City**
   - **Path**: `/api/analytics/purchases/groupby/city`
   - **Method**: `GET`
   - **Handler**: `createGetPurchasesByGroup('city')`
   - **Bulk Support**: `Yes`

### 11. **Purchases - Daily**
   - **Path**: `/api/analytics/purchases/daily`
   - **Method**: `GET`
   - **Handler**: `getDailyPurchases`
   - **Bulk Support**: `Yes`

---

### 12. **Realtime - Visitors**
   - **Path**: `/api/analytics/realtime/visitors`
   - **Method**: `GET`
   - **Handler**: `getVisitors`
   - **Bulk Support**: `No`

### 13. **Realtime - Visitors Last 3 Hours**
   - **Path**: `/api/analytics/realtime/visitors/last-3-hours`
   - **Method**: `GET`
   - **Handler**: `getVisitorsLast3Hours`
   - **Bulk Support**: `No`

### 14. **Realtime - Visitors by Country**
   - **Path**: `/api/analytics/realtime/visitors/groupby/country`
   - **Method**: `GET`
   - **Handler**: `createGetVisitorsByGroup('geo.country')`
   - **Bulk Support**: `No`

### 15. **Realtime - Visitors by Page**
   - **Path**: `/api/analytics/realtime/visitors/groupby/page`
   - **Method**: `GET`
   - **Handler**: `createGetVisitorsByGroup('page.title')`
   - **Bulk Support**: `No`

### 16. **Realtime - Visitors by Browser**
   - **Path**: `/api/analytics/realtime/visitors/groupby/browser`
   - **Method**: `GET`
   - **Handler**: `createGetVisitorsByGroup('device.browser')`
   - **Bulk Support**: `No`

---

### 17. **Interests - Total**
   - **Path**: `/api/analytics/interests/total`
   - **Method**: `GET`
   - **Handler**: `() => {}` *(Placeholder)*
   - **Bulk Support**: `Yes`

### 18. **Interests - Group by Topic**
   - **Path**: `/api/analytics/interests/groupby/topic`
   - **Method**: `GET`
   - **Handler**: `() => {}` *(Placeholder)*
   - **Bulk Support**: `Yes`

### 19. **Interests - Daily**
   - **Path**: `/api/analytics/interests/daily`
   - **Method**: `GET`
   - **Handler**: `() => {}` *(Placeholder)*
   - **Bulk Support**: `Yes`

---

### 20. **Uviews - Total**
   - **Path**: `/api/analytics/uviews/total`
   - **Method**: `GET`
   - **Handler**: `getTotalUViews`
   - **Bulk Support**: `Yes`

### 21. **Uviews - Group by Device**
   - **Path**: `/api/analytics/uviews/groupby/device`
   - **Method**: `GET`
   - **Handler**: `createGetUViewsByGroup('device.type')`
   - **Bulk Support**: `Yes`

### 22. **Uviews - Group by Browser**
   - **Path**: `/api/analytics/uviews/groupby/browser`
   - **Method**: `GET`
   - **Handler**: `createGetUViewsByGroup('device.browser')`
   - **Bulk Support**: `Yes`

### 23. **Uviews - Group by Operating System**
   - **Path**: `/api/analytics/uviews/groupby/os`
   - **Method**: `GET`
   - **Handler**: `createGetUViewsByGroup('device.os')`
   - **Bulk Support**: `Yes`

### 24. **Uviews - Group by Referrer**
   - **Path**: `/api/analytics/uviews/groupby/referrer`
   - **Method**: `GET`
   - **Handler**: `createGetUViewsByGroup('referrer')`
   - **Bulk Support**: `Yes`

### 25. **Uviews - Group by City**
   - **Path**: `/api/analytics/uviews/groupby/city`
   - **Method**: `GET`
   - **Handler**: `createGetUViewsByGroup('geo.city')`
   - **Bulk Support**: `Yes`

### 26. **Uviews - Group by Country**
   - **Path**: `/api/analytics/uviews/groupby/country`
   - **Method**: `GET`
   - **Handler**: `createGetUViewsByGroup('geo.country')`
   - **Bulk Support**: `Yes`

### 27. **Uviews - Daily**
   - **Path**: `/api/analytics/uviews/daily`
   - **Method**: `GET`
   - **Handler**: `getDailyUViews`
   - **Bulk Support**: `Yes`

### 28. **New vs. Returning**
   - **Path**: `/api/analytics/uviews/new-returning`
   - **Method**: `GET`
   - **Handler**: `getNewReturning`
   - **Bulk Support**: `Yes`

---

### 29. **Views - Total**
   - **Path**: `/api/analytics/views/total`
   - **Method**: `GET`
   - **Handler**: `getTotalViews`
   - **Bulk Support**: `Yes`

### 30. **Views - Group by Device**
   - **Path**: `/api/analytics/views/groupby/device`
   - **Method**: `GET`
   - **Handler**: `createGetViewsByGroup('device.type')`
   - **Bulk Support**: `Yes`

### 31. **Views - Group by Browser**
   - **Path**: `/api/analytics/views/groupby/browser`
   - **Method**: `GET`
   - **Handler**: `createGetViewsByGroup('device.browser')`
   - **Bulk Support**: `Yes`

### 32. **Views - Group by Operating System**
   - **Path**: `/api/analytics/views/groupby/os`
   - **Method**: `GET`
   - **Handler**: `createGetViewsByGroup('device.os')`
   - **Bulk Support**: `Yes`

### 33. **Views - Group by Referrer**
   - **Path**: `/api/analytics/views/groupby/referrer`
   - **Method**: `GET`
   - **Handler**: `createGetViewsByGroup('referrer')`
   - **Bulk Support**: `Yes`

### 34. **Views - Group by City**
   - **Path**: `/api/analytics/views/groupby/city`
   - **Method**: `GET`
   - **Handler**: `createGetViewsByGroup('geo.city')`
   - **Bulk Support**: `Yes`

### 35. **Views - Group by Country**
   - **Path**: `/api/analytics/views/groupby/country`
   - **Method**: `GET`
   - **Handler**: `createGetViewsByGroup('geo.country')`
   - **Bulk Support**: `Yes`

### 36. **Views - Daily**
   - **Path**: `/api/analytics/views/daily`
   - **Method**: `GET`
   - **Handler**: `getDailyViews`
   - **Bulk Support**: `Yes`