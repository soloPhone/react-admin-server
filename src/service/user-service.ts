import { User } from '../entities'
import { ObjectID } from 'mongodb'
import { getMongoRepository } from 'typeorm'
import { hashSync, compareSync } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { IloginForm, IqueryParams } from '../controller/user-controller'
import { only } from '../../utils'

export interface Iresult {
  message: string
  result?: any
  status?: string
  token?: string
}
export class UserService {
  // 查询列表
  async getList(form: IqueryParams): Promise<Iresult> {
    const userRepository = await getMongoRepository(User)
    // 查询出的数据和数据量
    console.log(typeof form.pageSize)
    const [items, totalCount] = await userRepository.findAndCount({
      take: form.pageSize ? +form.pageSize : 5
    })
    return {
      message: '处理成功',
      result: {
        items,
        totalCount
      }
    }
  }

  // 创建用户
  async addUser(user: User): Promise<Iresult> {
    try {
      const exitUser = await User.findOne({ username: user.username })
      if (exitUser) {
        return {
          message: '该用户名已被注册',
          result: {}
        }
      }
      // 加密
      const hash = hashSync(user.password, 10)
      user.password = hash
      const result = await user.save()
      return {
        message: '处理成功',
        result
      }
    } catch (err) {
      console.log(err)
    }
  }

  /**
   *
   * @param id
   */
  async doLogin({ email, password }: IloginForm): Promise<Iresult> {
    const userRepository = getMongoRepository(User)
    const [matchedUser] = await userRepository.find({
      where: { email }
    })
    if (matchedUser) {
      const { password: hash } = matchedUser
      const isMatch = compareSync(password, hash)
      const payload = only(matchedUser, ['_id', 'username', 'email', 'createDate'])
      if (isMatch) {
        const token = sign(payload, 'secret', { expiresIn: '7 days' })
        return {
          message: '处理成功',
          status: 'C0000',
          token: token
        }
      }
    }
    return {
      message: '账号或密码错误',
      status: 'E0000'
    }
  }

  /**
   * Find user
   * @param id {string} - user id
   */
  async getUser(id: string): Promise<Iresult> {
    const objectId = new ObjectID(id)
    const userRepository = getMongoRepository(User)
    const result = await userRepository.findOne({ _id: objectId })
    return {
      message: '处理成功',
      result
    }
  }

  /**
   * Delete user
   * @param id {string} - user id
   */
  async deleteUser(id: string): Promise<Iresult> {
    const objectId = new ObjectID(id)
    const userRepository = getMongoRepository(User)
    await userRepository.deleteOne({ _id: objectId })
    return {
      message: '删除成功',
      status: 'success'
    }
  }

  /**
   * Update user info
   * @param id {string}
   * @param user {User}
   */
  async updateUser(id: string, user: User): Promise<Iresult> {
    const objectId = new ObjectID(id)
    const userRepository = getMongoRepository(User)
    await userRepository.update({ _id: objectId }, user)
    return {
      message: '更新成功'
    }
  }
}
