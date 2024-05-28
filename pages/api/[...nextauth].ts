//미들웨어 
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prismadb from '@/lib/prismadb';
import { compare} from 'bcrypt';

//authentication인증을 위한 로직
export default NextAuth({
    providers: [
        //프로바이더에 크레덴셔날을 넣고 id,name, credentianls 정보를 넣어준다
        //여기서 email, password가 들어간다.
        Credentials({
            id : 'credentials',
            name : 'credentials',
            credentials: { 
                email : {
                    label: 'Email',
                    type: 'text',
                },
                password : {
                    label: 'Password',
                    type: 'password',
                }
            },
            //authrize에 credentianls정보가 들어가면 판정을하여 throw or user정보를 담아준다.
            async authorize(credentials){
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password requried");
                }

                //prismadb의 user를 뒤져서 email이 unique인지 아닌지 판명
                const user = await prismadb.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                //user가 바었거나 user.password가 비어있으면 뜨로우
                if (!user || !user.hashedPassword) {
                    throw new Error("Email does not exist");
                } 
                //compare에 credentianl password와 user haspassword를 넣어준다.
                const isCorrectPassword = await compare(
                    credentials.password, 
                    user.hashedPassword
                );

                //이것이 비어있다면 에러를 날려준다.
                if (!isCorrectPassword) {
                    throw new Error("Incorrect password");
                }

                //이제 user를 리턴해주어 auth정보를 넘겨준다.
                return user;
            }
        })
    ],
    //page 라우터의 역할?
    pages: {
        signIn: '/auth',
    },
    debug : process.env.NODE_ENV === 'development',
    session : {
        strategy: 'jwt',
    },
    jwt :{
        secret: process.env.NEXTAUTH_JWT_SECRET,
    },
    secret : process.env.NEXTAUTH_SECRET,

})