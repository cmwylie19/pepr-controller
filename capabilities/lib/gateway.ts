type Server = {
  redirectPort?: string;
  port?: string;
}
type JWTAuth = {
  secretKey?: string;
  insecureRoutes?: string[];
}
type RateLimit = {
  rate?: string;
};
export interface GatewayAttributes {
  [key: string]: GatewayBody
}
export interface GatewayBody {
  rateLimit?: RateLimit,
  jwtAuth?: JWTAuth,
  server?: Server,
}
