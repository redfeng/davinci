/*
 * <<
 * Davinci
 * ==
 * Copyright (C) 2016 - 2017 EDP
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

import * as React from 'react'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import { InjectedRouter } from 'react-router/lib/Router'

import { compose } from 'redux'
import injectReducer from '../../utils/injectReducer'
import injectSaga from '../../utils/injectSaga'
import bizlogicReducer from './reducer'
import bizlogicSaga from './sagas'
import sourceReducer from '../Source/reducer'
import sourceSaga from '../Source/sagas'

import 'codemirror/lib/codemirror.css'
import '../../assets/override/codemirror_theme.css'
import 'codemirror/addon/hint/show-hint.css'
const codeMirror = require('codemirror/lib/codemirror')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/mode/sql/sql')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/hint/sql-hint')
require('codemirror/addon/display/placeholder')

import Form from 'antd/lib/form'
import Row from 'antd/lib/row'
import Col from 'antd/lib/col'
import Input from 'antd/lib/input'
import Select from 'antd/lib/select'
import message from 'antd/lib/message'
const FormItem = Form.Item
import Tooltip from 'antd/lib/tooltip'
import Popover from 'antd/lib/popover'
import Dropdown from 'antd/lib/dropdown'
import Modal from 'antd/lib/modal'
import Menu from 'antd/lib/menu'
const MenuItem = Menu.Item
const Search = Input.Search
const Option = Select.Option
import AntdFormType from 'antd/lib/form/Form'

const utilStyles = require('../../assets/less/util.less')
const styles = require('./Bizlogic.less')
import { generateData } from '../../utils/util'

import {
  makeSelectSqlValidateCode,
  makeSelectSqlValidateMsg,
  makeSelectExecuteLoading,
  makeSelectModalLoading,
  makeSelectBizlogics,
  makeSelectViewTeam,
  makeSelectTeamAuth,
  makeSelectTeamConfig,
  makeSelectTeamSelectData
 } from './selectors'
import { checkNameUniqueAction, hideNavigator } from '../App/actions'
import { loadSchema, executeSql, addBizlogic, editBizlogic, loadBizlogics, loadViewTeam, getTeamAuth, loadTeamConfig, resetViewState } from './actions'
import { makeSelectSources } from '../Source/selectors'
import { loadSources } from '../Source/actions'
import { toListBF, getColumns, getTeamVariables } from './components/viewUtil'
import { ITeamParams, IViewTeams } from '../Bizlogic'
import EditorHeader from '../../components/EditorHeader'
import PaginationWithoutTotal from '../../components/PaginationWithoutTotal'
import SourcerSchema from './components/SourceSchema'
import ExecuteSql from './components/ExecuteSql'
import CompanyTreeAction from './CompanyTreeAction'

import CompanyForm from './CompanyForm'
import { PaginationProps } from 'antd/lib/pagination'

interface IBizlogicFormProps {
  router: InjectedRouter
  type: string
  sources: boolean | any[]
  sqlValidateCode: boolean | number
  sqlValidateMessage: boolean | string
  form: any
  route: any
  params: any
  bizlogics: boolean | any[]
  executeLoading: boolean
  modalLoading: boolean
  teamAuth: any
  viewTeam: IViewTeams[]
  teamConfig: any[]
  teamSelectData: any[]
  onHideNavigator: () => void
  onCheckUniqueName: (pathname: string, data: any, resolve: () => any, reject: (error: string) => any) => any
  onLoadSchema: (sourceId: number, resolve: any) => any
  onExecuteSql: (requestObj: any, resolve: any) => any
  onAddBizlogic: (type: string, values: object, resolve: any) => any
  onEditBizlogic: (type: string, values: object, resolve: any) => any
  onLoadSources: (projectId: number) => any
  onLoadBizlogics: (id: number, resolve?: any) => any
  onLoadViewTeam: (projectId: number, resolve?: any) => any
  onGetTeamAuth: (projectId: number, resolve?: any) => any
  onLoadTeamConfig: (viewId: number, resolve: any) => any
  onResetViewState: () => void
}

interface IBizlogicFormState {
  modelType: string
  dataList: any[]
  sourceIdGeted: number
  isDeclarate: string
  isShowSqlValidateAlert: boolean
  executeResultList: any[]
  executeColumns: any[]
  schemaData: any[]

  treeData: any[]
  listData: any[]
  teamCheckedKeys: any[]
  teamParams: [ITeamParams]
  configTeam: any[]
  screenWidth: number

  name: string
  description: string
  isNameExited: boolean
  selectedSourceName: string
  sqlExecuteCode: boolean | number
  limit: number
  sql: string
  totalCount: number
  teamVarArr: any[]
}

declare interface IObjectConstructor {
  assign (...objects: object[]): object
}

export class Bizlogic extends React.Component<IBizlogicFormProps, IBizlogicFormState> {
  private codeMirrorInstanceOfDeclaration: any
  private codeMirrorInstanceOfQuerySQL: any
  private asyncValidateResult: any
  constructor (props) {
    super(props)
    this.state = {
      modelType: '',
      dataList: [],
      sourceIdGeted: 0,
      isDeclarate: 'no',
      isShowSqlValidateAlert: false,
      executeResultList: [],
      executeColumns: [],
      schemaData: [],

      treeData: [],
      listData: [],
      teamCheckedKeys: [],
      teamParams: [{
        k: '',
        v: ''
      }],
      configTeam: [],
      screenWidth: 0,
      name: '',
      description: '',
      isNameExited: false,
      selectedSourceName: '',
      sqlExecuteCode: false,
      limit: 500,
      sql: '',
      totalCount: 0,
      teamVarArr: []
    }
    this.codeMirrorInstanceOfDeclaration = false
    this.codeMirrorInstanceOfQuerySQL = false
  }
  private companyForm: AntdFormType = null
  private refHandlers = {
    companyForm: (ref) => this.companyForm = ref
  }

  private placeholder = {
    name: '请输入View名称',
    description: '请输入描述…'
  }

  public componentWillMount () {
    const {
      params,
      route,
      bizlogics,
      onLoadSources,
      onLoadSchema,
      onLoadBizlogics,
      onLoadViewTeam,
      teamSelectData,
      onGetTeamAuth
    } = this.props
    const { selectedSourceName, schemaData } = this.state
    const { pid, bid } = params

    this.setState({
      screenWidth: document.documentElement.clientWidth
    })

    if (!bizlogics) {
      onLoadBizlogics(pid)
    }

    onLoadSources(pid)
    onLoadViewTeam(pid)

    if (route.path === '/project/:pid/bizlogic') {
      onGetTeamAuth(pid)
    }
  }

  public componentWillReceiveProps (nextProps) {
    const { viewTeam, sqlValidateCode, teamConfig, teamSelectData } =  nextProps
    const { listData, teamCheckedKeys, schemaData } = this.state
    const { route, params, bizlogics } = this.props

    window.onresize = () => this.setState({ screenWidth: document.documentElement.clientWidth })

    let listDataFinal
    if (listData.length === 0) {
      listDataFinal = toListBF(viewTeam).map((td) => {
        const arr = [{
          k: '',
          v: ''
        }]
        let paramsTemp
        let checkedTemp
        if (bizlogics) {
          if (route.path === '/project/:pid/bizlogic') {
            // 新增
            paramsTemp = arr
            checkedTemp = teamCheckedKeys.indexOf(`${td.id}`) >= 0
          } else {
            // 修改
            if (teamConfig.length !== 0) {
              const currentConfig = teamConfig.find((ta) => ta.id === td.id)
              paramsTemp = currentConfig ? currentConfig.params : []
              checkedTemp = currentConfig ? true : false
            } else {
              paramsTemp = arr
              checkedTemp = false
            }
          }
        } else {
          paramsTemp = arr
        }

        const listItem = {
          ...td,
          checked: checkedTemp,
          params: paramsTemp
        }
        return listItem
      })
    } else {
      listDataFinal = this.state.listData.map((td) => {
        const listItem = {
          ...td,
          checked: teamCheckedKeys.indexOf(`${td.id}`) >= 0,
          params: td.params
        }
        return listItem
      })
    }

    const teamKeyArr = listDataFinal.filter((ldf) => ldf.checked).map((arr) => `${arr.id}`)

    this.setState({
      treeData: viewTeam,
      listData: listDataFinal,
      teamCheckedKeys: teamKeyArr,
      sqlExecuteCode: sqlValidateCode
    })
   }

  public componentDidMount () {
    const { params, bizlogics, onLoadBizlogics, viewTeam } = this.props
    const { schemaData } = this.state

    this.props.onHideNavigator()

    this.generateList(generateData(schemaData))
    const queryTextarea = document.querySelector('#sql_tmpl')
    this.handleTmplCodeMirror(queryTextarea)

    if (params.bid) {
      if (bizlogics) {
        this.props.onLoadViewTeam(params.pid, (result) => {
          this.showViewInfo(bizlogics, toListBF(result))
        })
      } else {
        new Promise((resolve) => {
          onLoadBizlogics(params.pid, (bzs) => {
            resolve(bzs)
          })
        }).then((bzs) => {
          this.props.onLoadViewTeam(params.pid, (result) => {
            this.showViewInfo(bzs, toListBF(result))
          })
        })
      }
    }
  }

  private showViewInfo (bizlogics, viewTeam) {
    const { params, onLoadSchema, teamAuth } = this.props
    const { listData, limit } = this.state

    const currentViewItem = (bizlogics as any[]).find((b) => b.id === Number(params.bid))
    const {
      name,
      description,
      source,
      sourceId,
      sql,
      model
    } = currentViewItem
    const dec = (sql.includes('{') && sql.substring(0, sql.lastIndexOf('{')) !== '')

    onLoadSchema(sourceId, (res) => {
      this.setState({
        schemaData: res,
        sourceIdGeted: sourceId
      }, () => {
        this.promptCodeMirror(generateData(this.state.schemaData))
      })
    })

    if (model) {
      const modelObj = JSON.parse(model)
      const modelArr = []
      for (const o in modelObj) {
        if (modelObj.hasOwnProperty(o)) {
          modelArr.push({ name: o, ...modelObj[o]})
        }
      }
      this.setState({ executeColumns : modelArr })
    } else {
      this.setState({ executeColumns : [] })
    }

    // const configTeam = config ? JSON.parse(config).team : ''
    const requestObj = {
      sourceIdGeted: sourceId,
      sql,
      pageNo: 0,
      pageSize: 0,
      limit
    }

    this.props.onExecuteSql(requestObj, (result) => {
      const { resultList, totalCount } = result
      this.setState({
        executeResultList: resultList,
        totalCount
      })
    })

    new Promise((resolve) => {
      this.props.onGetTeamAuth(params.pid, (result) => {
        resolve(result)
      })
    }).then((result) => {
      if (!(result as any).sourceOrg) {
        this.props.onLoadTeamConfig(params.bid, (teamConfig) => {
          const listDataFinal = viewTeam.map((ld) => {
            ld.params = teamConfig.length !== 0
              ? teamConfig.find((ct) => ld.id === ct.id)
                ? teamConfig.find((ct) => ld.id === ct.id).params
                : []
              : []
            ld.checked = teamConfig.length !== 0
              ? teamConfig.find((ct) => ld.id === ct.id)
                ? true
                : false
              : false
            return ld
          })
          const teamKeyArr = listDataFinal.filter((ldf) => ldf.checked).map((arr) => `${arr.id}`)

          this.setState({
            listData: listDataFinal,
            teamCheckedKeys: teamKeyArr,
            teamParams: teamConfig.length !== 0 ? teamConfig[0].params.map((o) => {
              return {
                k: o.k,
                v: o.v
              }
            }) : []
          })
        })
      }
    })

    this.setState({
      sql,
      selectedSourceName: source.name,
      name,
      description
    })

    this.props.form.setFieldsValue({
      id: Number(params.bid),
      source_id: `${sourceId}`,
      source_name: source.name,
      isDeclarate: dec ? 'yes' : 'no'
    })

    if (dec) {
      this.setState({
        isDeclarate: 'yes'
      }, () => {
        const declareTextarea = document.querySelector('#declaration')
        this.handleDelareCodeMirror(declareTextarea)
        this.codeMirrorInstanceOfDeclaration.doc.setValue(sql.includes('{') ? sql.substring(0, sql.indexOf('{')) : sql)
        this.setState({
          teamVarArr: getTeamVariables(sql)
        })
      })
    } else {
      this.codeMirrorInstanceOfDeclaration = false
    }
    this.codeMirrorInstanceOfQuerySQL.doc.setValue(sql.includes('{') ? sql.substring(sql.indexOf('{') + 1, sql.lastIndexOf('}')) : '')
  }

  private initChangeIsDeclarate  = (e) => {
    this.setState({
      isDeclarate: e.target.value
    }, () => {
      const declareTextarea = document.querySelector('#declaration')
      this.handleDelareCodeMirror(declareTextarea)
    })
  }

  private handleDelareCodeMirror = (declareWrapperDom) => {
    if (!this.codeMirrorInstanceOfDeclaration) {
      this.codeMirrorInstanceOfDeclaration = codeMirror.fromTextArea(declareWrapperDom, {
        mode: 'text/x-sql',
        theme: '3024-day',
        width: '100%',
        height: '100%',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        foldGutter: true
      })
      // this.codeMirrorInstanceOfDeclaration.setSize('100%', 160)
    }
  }

  private handleTmplCodeMirror = (queryWrapperDOM) => {
    if (!this.codeMirrorInstanceOfQuerySQL) {
      this.codeMirrorInstanceOfQuerySQL = codeMirror.fromTextArea(queryWrapperDOM, {
        mode: 'text/x-sql',
        theme: '3024-day',
        width: '100%',
        height: '100%',
        lineNumbers: true,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        foldGutter: true
      })
    }
  }

  private promptCodeMirror = (data) => {
    this.codeMirrorInstanceOfQuerySQL.on('change', (editor, change) => {
      const tableDatas = {}
      const filedDatas = {}
      if (data) {
        data.forEach((i) => {
          const { children, title } = i
          const childArr = []
          children.forEach((j) => {
            childArr.push(j.title)
          })

          childArr.forEach((ca) => {
            filedDatas[ca] = []
          })

          tableDatas[title] = []
        })
      }

      let obj = {}
      if (this.codeMirrorInstanceOfDeclaration) {
        const declareValue = this.codeMirrorInstanceOfDeclaration.getValue()
        const declareParams = (declareValue.match(/query@var\s+\$\w+\$/g) || [])
          .map((qv) => qv.substring(qv.indexOf('$'), qv.lastIndexOf('$') + 1))

        declareParams.forEach((d) => {
          obj[d] = []
        })
      } else {
        obj = {}
      }

      if (change.origin === '+input'
          && change.text[0] !== ';'
          && change.text[0].trim() !== ''
          && change.text[1] !== '') {
        this.codeMirrorInstanceOfQuerySQL.showHint({
          completeSingle: false,
          tables: {...obj, ...tableDatas, ...filedDatas}
        })
      }
    })
  }

  private generateList = (data) => {
    data.forEach((i) => {
      const key = i.key
      this.state.dataList.push({ key, title: key })
      if (i.children) {
        // this.generateList(node.children, node.key)
      }
    })
  }

  private initSelectSource = (source) => {
    const { sources, onLoadSchema } = this.props
    const currentSource = (sources as any[]).find((s) => s.id === Number(source.key))
    this.setState({
      selectedSourceName: currentSource.name
    })
    this.props.form.setFieldsValue({
      source_id: Number(currentSource.id),
      source_name: currentSource.name
    })
    onLoadSchema(Number(source.key), (result) => {
      this.setState({
        schemaData: result,
        sourceIdGeted: Number(source.key)
      }, () => {
        this.promptCodeMirror(generateData(this.state.schemaData))
      })
    })
  }

  private initExecuteSql = () => {
    const { sourceIdGeted, listData, isDeclarate, limit } = this.state

    const { onExecuteSql, params } = this.props
    const { pid, bid } = params

    const sqlTmpl = this.codeMirrorInstanceOfQuerySQL.getValue()

    let sql = ''
    if (isDeclarate === 'yes' && this.codeMirrorInstanceOfDeclaration) {
      const declaration = this.codeMirrorInstanceOfDeclaration.getValue()
      sql = `${declaration}{${sqlTmpl}}`
      this.getTeamTreeData(sql)
    } else {
      sql = `{${sqlTmpl}}`
      const listDataFinal = listData.map((ld) => {
        ld.params = []
        return ld
      })
      this.setState({
        teamParams: [{
          k: '',
          v: ''
        }],
        listData: listDataFinal
      }, () => {
        this.setState({
          teamCheckedKeys: []
        })
      })
    }

    this.setState({ sql })

    const requestObj = {
      sourceIdGeted,
      sql,
      pageNo: 0,
      pageSize: 0,
      limit
    }

    this.props.onExecuteSql(requestObj, (result) => {
      if (result) {
        const { resultList, columns, totalCount } = result
        this.setState({
          executeResultList: resultList,
          executeColumns: getColumns(columns),
          totalCount
        })
      }
    })

    this.asyncValidateResult = setTimeout(() => {
      this.setState({
        isShowSqlValidateAlert: true
      })
    }, 100)
  }

  private initSelectModelItem = (record, item) => (val) => {
    const { executeColumns } = this.state
    const obj = {
      name: record.name,
      sqlType: record.sqlType,
      visualType: item === 'visualType' ? val : record.visualType,
      modelType: item === 'modelType'
        ? val.target.value === '维度' ? 'category' : 'value'
        : record.modelType
    }
    executeColumns.splice(executeColumns.findIndex((c) => c.name === record.name), 1, obj)
    this.setState({
      executeColumns: executeColumns.slice()
    })
  }

  private onTeamParamChange = (id, paramIndex) => (e) => {
    const { listData } = this.state

    const changed = listData.find((i) => i.id === id)
    changed.params[paramIndex].v = e.target.value
    this.setState({
      listData: listData.slice()
    })
  }

  private onModalOk = () => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const { executeColumns, listData, isDeclarate, name, description, isNameExited, sqlExecuteCode, limit } = this.state
        const { route, params, teamAuth } = this.props

        const { id, source_id, source_name } = values
        if (!name.trim()) {
          message.error('View名称不能为空')
          return
        }
        if (isNameExited) {
          message.error('View名称已存在')
          return
        }
        if (!source_id || !source_name) {
          message.error('请选择一个Source')
          return
        }

        switch (sqlExecuteCode) {
          case 200:
            const sqlTmpl = this.codeMirrorInstanceOfQuerySQL.doc.getValue()
            let querySql = ''
            if (isDeclarate === 'yes' && this.codeMirrorInstanceOfDeclaration) {
              const declaration = this.codeMirrorInstanceOfDeclaration.doc.getValue()
              querySql = sqlTmpl ? `${declaration}{${sqlTmpl}}` : declaration
            } else {
              querySql = sqlTmpl ? `{${sqlTmpl}}` : ''
            }

            const modelObj = {}
            executeColumns.forEach((m) => {
              const { name, sqlType, visualType, modelType  } = m
              modelObj[name] = {
                sqlType,
                visualType,
                modelType
              }
            })

            const configTeamStr = listData
            .filter((ld) => ld.checked)
            .map((ld) => ({
              id: ld.id,
              params: ld.params
            }))

            const requestValue = {
              name,
              description,
              sql: querySql,
              model: JSON.stringify(modelObj),
              config: configTeamStr.length !== 0
                ? JSON.stringify({
                    team: configTeamStr
                  })
                : '',
              projectId: params.pid
            }

            if (route.path === '/project/:pid/bizlogic') {
              this.props.onAddBizlogic(teamAuth.sourceOrg, {
                ...requestValue,
                sourceId: Number(source_id)
              }, () => {
                this.hideForm()
              })
            } else {
              this.props.onEditBizlogic(teamAuth.sourceOrg, {
                ...requestValue,
                id,
                source: {
                  id: Number(source_id),
                  name: source_name
                }
              }, () => {
                this.hideForm()
              })
            }
            break
          default:
            message.error('请检查SQL语句是否正确！', 3)
            break
        }
      }
    })
  }

  private hideForm = () => {
    this.setState({
      executeResultList: [],
      executeColumns: [],
      isDeclarate: 'no'
    }, () => {
      this.codeMirrorInstanceOfDeclaration = false
      // this.codeMirrorInstanceOfQuerySQL = false
      this.setState({
        isShowSqlValidateAlert: false
      })
    })

    this.props.form.resetFields()
    this.props.router.push(`/project/${this.props.params.pid}/bizlogics`)
  }

  public componentWillUnmount () {
    clearTimeout(this.asyncValidateResult)
    this.props.onResetViewState()
  }

  private changeName = (e) => {
    const { onCheckUniqueName, route, params, form } = this.props
    const { id } = form.getFieldsValue()

    const data = {
      projectId: params.pid,
      id: route.path === '/project/:pid/bizlogic' ? '' : id,
      name: e.currentTarget.value
    }
    this.setState({
      name: e.currentTarget.value
    })
    onCheckUniqueName('view', data, () => {
      this.setState({
        isNameExited: false
      })
      }, (err) => {
        this.setState({
          isNameExited: true
        })
      })
  }

  private changeDesc = (e) => {
    this.setState({
      description: e.currentTarget.value
    })
  }

  private getListData (checkedKeys) {
    const { listData, teamParams } = this.state
    const listDataFinal = listData.map((td) => {
      const noParams = teamParams.map((teamParam) => {
        return {
          k: teamParam.k,
          v: ''
        }
      })
      const listItem = {
        ...td,
        checked: checkedKeys.indexOf(`${td.id}`) >= 0,
        params: td.params.length ? td.params : noParams
      }
      return listItem
    })
    return listDataFinal
  }

  private onCheck = (checkedKeys) => {
    this.setState({
      listData: this.getListData(checkedKeys.checked),
      teamCheckedKeys: checkedKeys.checked
    })
  }

  private cancel = () => {
    this.props.router.goBack()
  }

  private changeTabs = (value) => {
    const { teamParams } = this.state
    const { params, bizlogics } = this.props
    if (!teamParams.length) {
      const sqlVal = params.bid
        ? (bizlogics as any[]).find((b) => b.id === Number(params.bid)).sql
        : bizlogics[0].sql
      this.getTeamTreeData(sqlVal)
    }
  }

  private getTeamTreeData (sql) {
    const { listData } = this.state

    const teamParamsTemp = getTeamVariables(sql)

    const paramsTemp = teamParamsTemp.map((gp) => {
      return {
        k: gp,
        v: ''
      }
    })

    const listDataFinal = listData.map((ld) => {
      const originParams = ld.params

      ld.params = teamParamsTemp.map((tp) => {
        const alreadyInUseParam = originParams.find((o) => o.k === tp)

        if (alreadyInUseParam) {
          return (Object as IObjectConstructor).assign({}, alreadyInUseParam)
        } else {
          return {
            k: tp,
            v: ''
          }
        }
      })
      return ld
    })

    this.setState({
      teamParams: paramsTemp,
      listData: listDataFinal.slice(),
      teamVarArr: teamParamsTemp
    })
  }

  private limitChange = (val) => {
    this.setState({ limit: val })
  }

  private onChangeDataTable = (current: number, pageSize: number) => {
    const { sourceIdGeted, sql } = this.state

    this.props.onExecuteSql({
      sourceIdGeted,
      sql,
      pageNo: current,
      pageSize
    }, (result) => {
      if (result) {
        const { resultList, columns, totalCount } = result
        this.setState({
          executeResultList: resultList,
          executeColumns: getColumns(columns),
          totalCount
        })
      }
    })
  }

  public render () {
    const {
      form,
      type,
      sources,
      sqlValidateMessage,
      executeLoading,
      modalLoading,
      route,
      viewTeam,
      teamAuth,
      teamSelectData
    } = this.props

    const { getFieldDecorator } = form
    const {
      isDeclarate,
      isShowSqlValidateAlert,
      executeResultList,
      executeColumns,
      schemaData,
      treeData,
      screenWidth,
      name,
      description,
      selectedSourceName,
      sqlExecuteCode,
      totalCount,
      limit,
      dataList,
      teamParams,
      listData,
      teamCheckedKeys
    } = this.state

    return (
      <div className={styles.bizlogic}>
        <EditorHeader
          currentType="view"
          className={styles.header}
          name={name}
          description={description}
          placeholder={this.placeholder}
          onNameChange={this.changeName}
          onDescriptionChange={this.changeDesc}
          onSave={this.onModalOk}
          onCancel={this.cancel}
          loading={modalLoading}
        />
        <Form className={styles.formView}>
          <Row className={`${styles.formLeft} no-item-margin`}>
            <Col span={24} className={styles.leftInput}>
              <FormItem className={utilStyles.hide}>
                {getFieldDecorator('id', {
                  hidden: type === 'add'
                })(
                  <Input />
                )}
              </FormItem>
            </Col>
            <SourcerSchema
              form={form}
              selectedSourceName={selectedSourceName}
              dataList={dataList}
              schemaData={schemaData}
              sources={sources}
              initSelectSource={this.initSelectSource}
            />
          </Row>
          <ExecuteSql
            form={form}
            route={route}
            executeResultList={executeResultList}
            executeColumns={executeColumns}
            screenWidth={screenWidth}
            isShowSqlValidateAlert={isShowSqlValidateAlert}
            sqlExecuteCode={sqlExecuteCode}
            sqlValidateMessage={sqlValidateMessage}
            totalCount={totalCount}
            isDeclarate={isDeclarate}
            limit={limit}
            executeLoading={executeLoading}
            teamParams={teamParams}
            listData={listData}
            viewTeam={viewTeam}
            teamCheckedKeys={teamCheckedKeys}
            initSelectModelItem={this.initSelectModelItem}
            initExecuteSql={this.initExecuteSql}
            initChangeIsDeclarate={this.initChangeIsDeclarate}
            limitChange={this.limitChange}
            onTeamParamChange={this.onTeamParamChange}
            onCheck={this.onCheck}
            changeTabs={this.changeTabs}
          />
        </Form>
      </div>
    )
  }
}

const mapStateToProps = createStructuredSelector({
  sqlValidateCode: makeSelectSqlValidateCode(),
  sqlValidateMessage: makeSelectSqlValidateMsg(),
  executeLoading: makeSelectExecuteLoading(),
  sources: makeSelectSources(),
  modalLoading: makeSelectModalLoading(),
  bizlogics: makeSelectBizlogics(),
  viewTeam: makeSelectViewTeam(),
  teamAuth: makeSelectTeamAuth(),
  teamConfig: makeSelectTeamConfig(),
  teamSelectData: makeSelectTeamSelectData()
})

function mapDispatchToProps (dispatch) {
  return {
    onHideNavigator: () => dispatch(hideNavigator()),
    onCheckUniqueName: (pathname, data, resolve, reject) => dispatch(checkNameUniqueAction(pathname, data, resolve, reject)),
    onLoadSchema: (sourceId, resolve) => dispatch(loadSchema(sourceId, resolve)),
    onExecuteSql: (requestObj, resolve) => dispatch(executeSql(requestObj, resolve)),
    onAddBizlogic: (type, bizlogic, resolve) => dispatch(addBizlogic(type, bizlogic, resolve)),
    onEditBizlogic: (type, bizlogic, resolve) => dispatch(editBizlogic(type, bizlogic, resolve)),
    onLoadSources: (projectId) => dispatch(loadSources(projectId)),
    onLoadBizlogics: (projectId, resolve) => dispatch(loadBizlogics(projectId, resolve)),
    onLoadViewTeam: (projectId, resolve) => dispatch(loadViewTeam(projectId, resolve)),
    onGetTeamAuth: (projectId, resolve) => dispatch(getTeamAuth(projectId, resolve)),
    onLoadTeamConfig: (viewId, resolve) => dispatch(loadTeamConfig(viewId, resolve)),
    onResetViewState: () => dispatch(resetViewState())
  }
}

const withConnect = connect(mapStateToProps, mapDispatchToProps)

const withReducerBizlogic = injectReducer({ key: 'bizlogic', reducer: bizlogicReducer })
const withSagaBizlogic = injectSaga({ key: 'bizlogic', saga: bizlogicSaga })

const withReducerSource = injectReducer({ key: 'source', reducer: sourceReducer })
const withSagaSource = injectSaga({ key: 'source', saga: sourceSaga })

export default compose(
  withReducerBizlogic,
  withReducerSource,
  withSagaBizlogic,
  withSagaSource,
  withConnect
)(Form.create()(Bizlogic))
