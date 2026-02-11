# # Build Angular
# FROM node:20 as build

# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm run build --prod

# # Serve with nginx
# FROM nginx:alpine

# COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# ---------- BUILD STAGE ----------
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- NGINX STAGE ----------
FROM nginx:alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
