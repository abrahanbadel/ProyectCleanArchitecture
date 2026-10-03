export interface LoginInputDTO {
    email: string;
    password: string
  }
  
  export interface LoginOutputDTO {
    token: string;
    user: {
      id: string;
      name: string;
      email: string
    }
  };
  
  export interface RegisterUserInputDTO {
    email: string;
    password: string;
    name: string;
  }
  
  export interface RegisterUserOutputDTO {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  }